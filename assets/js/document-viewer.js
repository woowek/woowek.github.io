// Document Viewer for GitHub Repository
const REPO_OWNER = 'woowek';
const REPO_NAME = 'documents';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

let allFiles = [];
let fileTree = {};
const CACHE_KEY = 'woowek_docs_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 캐시에서 데이터 가져오기
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.files;
      }
    }
  } catch (e) {
    console.error('Cache error:', e);
  }
  return null;
}

// 캐시에 데이터 저장
function setCache(files) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      files: files,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Cache save error:', e);
  }
}

// Repository의 파일 목록 가져오기 (재귀적)
async function fetchFiles(path = '') {
  try {
    // GitHub API 호출 시 헤더 추가
    const response = await fetch(`${API_BASE}/contents/${path}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!response.ok) {
      // Rate limit 확인
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const errorMsg = remaining === '0' 
        ? 'GitHub API rate limit 초과. 잠시 후 다시 시도해주세요.' 
        : `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    
    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        await fetchFiles(item.path);
      }
    }
    
    if (path === '') {
      buildFileTree();
      displayFileTree();
      document.getElementById('loading').style.display = 'none';
    }
  } catch (error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').innerHTML = `
      <strong>⚠️ 오류 발생:</strong> ${error.message}<br>
      <small>Repository: <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}" target="_blank">${REPO_OWNER}/${REPO_NAME}</a></small>
    `;
  }
}

// 파일 트리 구조 생성
function buildFileTree() {
  fileTree = {};
  
  allFiles.forEach(file => {
    const parts = file.path.split('/');
    let current = fileTree;
    
    // 폴더 구조 생성
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (!current[folderName]) {
        current[folderName] = { _type: 'folder', _files: {} };
      }
      current = current[folderName]._files;
    }
    
    // 파일 추가
    const fileName = parts[parts.length - 1];
    current[fileName] = {
      _type: 'file',
      path: file.path,
      download_url: file.download_url,
      html_url: file.html_url
    };
  });
}

// 트리 HTML 생성
function createTreeHTML(tree, level = 0) {
  let html = '';
  const entries = Object.entries(tree).sort((a, b) => {
    // 폴더를 파일보다 먼저 표시
    if (a[1]._type === 'folder' && b[1]._type === 'file') return -1;
    if (a[1]._type === 'file' && b[1]._type === 'folder') return 1;
    return a[0].localeCompare(b[0]);
  });
  
  entries.forEach(([name, data]) => {
    if (name.startsWith('_')) return; // 메타데이터 스킵
    
    const indent = level * 20;
    
    if (data._type === 'folder') {
      const folderId = 'folder-' + Math.random().toString(36).substr(2, 9);
      html += `
        <div class="tree-folder" style="margin-left: ${indent}px;">
          <div class="folder-header" onclick="toggleFolder('${folderId}')">
            <span class="folder-icon">📁</span>
            <span class="folder-name">${name}</span>
          </div>
          <div id="${folderId}" class="folder-content">
            ${createTreeHTML(data._files, level + 1)}
          </div>
        </div>
      `;
    } else if (data._type === 'file') {
      html += `
        <div class="tree-file" style="margin-left: ${indent}px;">
          <a href="#" onclick="loadFile('${data.path}', '${data.download_url}'); return false;" class="file-link">
            <span class="file-icon">📄</span>
            <span class="file-name">${name}</span>
          </a>
        </div>
      `;
    }
  });
  
  return html;
}

// 파일 트리 표시
function displayFileTree() {
  const fileTreeDiv = document.getElementById('file-tree');
  
  if (allFiles.length === 0) {
    fileTreeDiv.innerHTML = '<p style="color: #666; padding: 20px;">📭 마크다운 파일을 찾을 수 없습니다.</p>';
    return;
  }
  
  let html = `
    <div class="tree-header">
      <h3>📂 Files (${allFiles.length})</h3>
    </div>
    <div class="tree-content">
      ${createTreeHTML(fileTree)}
    </div>
  `;
  
  fileTreeDiv.innerHTML = html;
}

// 폴더 토글
function toggleFolder(folderId) {
  const folder = document.getElementById(folderId);
  const header = folder.previousElementSibling;
  const icon = header.querySelector('.folder-icon');
  
  if (folder.style.display === 'none') {
    folder.style.display = 'block';
    icon.textContent = '📂';
  } else {
    folder.style.display = 'none';
    icon.textContent = '📁';
  }
}

// 파일 내용 로드 및 마크다운 렌더링
async function loadFile(path, downloadUrl) {
  const contentDiv = document.getElementById('content');
  
  // 모든 파일 링크의 active 클래스 제거
  document.querySelectorAll('.file-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // 클릭된 파일 링크에 active 클래스 추가
  event.target.closest('.file-link').classList.add('active');
  
  contentDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">📖 파일을 불러오는 중...</p>';
  
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const markdown = await response.text();
    const html = marked.parse(markdown);
    
    contentDiv.innerHTML = `
      <div class="document-viewer">
        <div class="document-header">
          <h2>📄 ${path}</h2>
          <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/${path}" target="_blank" class="github-link">
            GitHub에서 보기 →
          </a>
        </div>
        <div class="markdown-body">
          ${html}
        </div>
      </div>
    `;
    
    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    contentDiv.innerHTML = `
      <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 6px; color: #c00;">
        <strong>⚠️ 파일을 불러올 수 없습니다:</strong> ${error.message}
      </div>
    `;
  }
}

// 페이지 로드 시 파일 목록 가져오기
(async function initDocumentViewer() {
  // 먼저 캐시 확인
  const cached = getCache();
  if (cached && cached.length > 0) {
    allFiles = cached;
    buildFileTree();
    displayFileTree();
    document.getElementById('loading').innerHTML = '✅ 캐시에서 로드됨 (5분간 유효)';
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 2000);
    return;
  }
  
  // 캐시가 없으면 API 호출
  try {
    await fetchFiles();
    setCache(allFiles);
  } catch (error) {
    console.error('Failed to fetch files:', error);
  }
})();
