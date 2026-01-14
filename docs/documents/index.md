---
title: Documents
layout: default
nav_order: 2
---

# Documents Repository

<div id="loading" style="text-align: center; padding: 20px; color: #666;">
  📂 Loading documents from repository...
</div>
<div id="error" style="display:none; padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c00;"></div>

<div class="documents-container">
  <div id="file-tree" class="file-tree"></div>
  <div id="content" class="content-area"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
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
(async function() {
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
</script>

<style>
/* 레이아웃 */
.documents-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.file-tree {
  width: 300px;
  min-width: 300px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 0;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: sticky;
  top: 20px;
}

.content-area {
  flex: 1;
  min-width: 0;
}

/* 트리 헤더 */
.tree-header {
  padding: 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tree-header h3 {
  margin: 0;
  font-size: 16px;
  color: #24292e;
}

.tree-content {
  padding: 8px 0;
}

/* 폴더 스타일 */
.tree-folder {
  margin: 2px 0;
}

.folder-header {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.folder-header:hover {
  background: #e1e4e8;
}

.folder-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.folder-name {
  font-size: 14px;
  font-weight: 500;
  color: #24292e;
}

.folder-content {
  display: block;
  margin-left: 8px;
  border-left: 1px solid #d1d5da;
  padding-left: 4px;
}

/* 파일 스타일 */
.tree-file {
  margin: 1px 0;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  text-decoration: none;
  color: #0366d6;
  border-radius: 4px;
  transition: background 0.2s;
}

.file-link:hover {
  background: #e1e4e8;
  text-decoration: none;
}

.file-link.active {
  background: #0366d6;
  color: #fff;
}

.file-link.active .file-name {
  color: #fff;
  font-weight: 600;
}

.file-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.file-name {
  font-size: 13px;
  color: #24292e;
  word-break: break-word;
}

/* 문서 뷰어 */
.document-viewer {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 24px;
  background: #fff;
}

.document-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e1e4e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.document-header h2 {
  margin: 0;
  color: #0366d6;
  font-size: 24px;
}

.github-link {
  color: #586069;
  font-size: 14px;
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}

/* 마크다운 본문 스타일 */
.markdown-body {
  line-height: 1.6;
}

.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.25em; }

.markdown-body code {
  background: #f6f8fa;
  padding: 3px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 85%;
}

.markdown-body pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  line-height: 1.45;
}

.markdown-body pre code {
  background: transparent;
  padding: 0;
  font-size: 100%;
}

.markdown-body blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
  margin: 16px 0;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 8px 13px;
}

.markdown-body table th {
  background: #f6f8fa;
  font-weight: 600;
}

.markdown-body table tr:nth-child(2n) {
  background: #f6f8fa;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
}

.markdown-body li {
  margin: 0.25em 0;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body hr {
  border: none;
  border-top: 1px solid #e1e4e8;
  margin: 24px 0;
}

/* 반응형 */
@media (max-width: 768px) {
  .documents-container {
    flex-direction: column;
  }
  
  .file-tree {
    width: 100%;
    max-height: 400px;
    position: static;
  }
}
</style>
