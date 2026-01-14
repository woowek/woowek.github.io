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
<div id="file-list"></div>
<div id="content" style="margin-top: 30px;"></div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
const REPO_OWNER = 'woowek';
const REPO_NAME = 'documents';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

let allFiles = [];

// Repository의 파일 목록 가져오기 (재귀적)
async function fetchFiles(path = '') {
  try {
    const response = await fetch(`${API_BASE}/contents/${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    
    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        await fetchFiles(item.path);
      }
    }
    
    if (path === '') {
      displayFileList();
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

// 파일 목록 표시
function displayFileList() {
  const fileListDiv = document.getElementById('file-list');
  
  if (allFiles.length === 0) {
    fileListDiv.innerHTML = '<p style="color: #666;">📭 마크다운 파일을 찾을 수 없습니다.</p>';
    return;
  }
  
  let html = `
    <h2>📑 파일 목록 (총 ${allFiles.length}개)</h2>
    <div style="border: 1px solid #e1e4e8; border-radius: 6px; overflow: hidden;">
  `;
  
  allFiles.forEach((file, index) => {
    const bgColor = index % 2 === 0 ? '#f6f8fa' : '#fff';
    html += `
      <div style="padding: 12px 16px; background: ${bgColor}; border-bottom: 1px solid #e1e4e8; display: flex; justify-content: space-between; align-items: center;">
        <a href="#" onclick="loadFile('${file.path}', '${file.download_url}'); return false;" 
           style="color: #0366d6; text-decoration: none; flex: 1;">
          📄 ${file.path}
        </a>
        <a href="${file.html_url}" target="_blank" 
           style="color: #586069; font-size: 12px; margin-left: 10px;">
          GitHub에서 보기 →
        </a>
      </div>
    `;
  });
  
  html += '</div>';
  fileListDiv.innerHTML = html;
}

// 파일 내용 로드 및 마크다운 렌더링
async function loadFile(path, downloadUrl) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">📖 파일을 불러오는 중...</p>';
  
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const markdown = await response.text();
    const html = marked.parse(markdown);
    
    contentDiv.innerHTML = `
      <div style="border: 2px solid #0366d6; border-radius: 8px; padding: 24px; background: #fff;">
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #e1e4e8;">
          <h2 style="margin: 0; color: #0366d6;">📄 ${path}</h2>
          <p style="margin: 8px 0 0 0; color: #586069; font-size: 14px;">
            <a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/${path}" target="_blank">
              GitHub에서 원본 보기 →
            </a>
          </p>
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
fetchFiles();
</script>

<style>
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
</style>
