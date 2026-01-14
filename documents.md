---
title: Documents
layout: default
nav_order: 2
---

# Documents Repository

<div id="loading">Loading documents...</div>
<div id="error" style="display:none; color: red;"></div>
<div id="file-list"></div>
<div id="content"></div>

<script>
const REPO_OWNER = 'woowek';
const REPO_NAME = 'documents';
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

let allFiles = [];
let currentFile = null;

// Markdown 렌더링을 위한 marked.js 로드
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(script);

script.onload = () => {
  fetchFiles();
};

// Repository의 파일 목록 가져오기
async function fetchFiles(path = '') {
  try {
    const response = await fetch(`${API_BASE}/contents/${path}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
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
    document.getElementById('error').textContent = `Error: ${error.message}`;
  }
}

// 파일 목록 표시
function displayFileList() {
  const fileListDiv = document.getElementById('file-list');
  
  if (allFiles.length === 0) {
    fileListDiv.innerHTML = '<p>No markdown files found.</p>';
    return;
  }
  
  let html = '<h2>Available Documents</h2><ul class="file-list">';
  
  allFiles.forEach(file => {
    html += `<li><a href="#" onclick="loadFile('${file.path}', '${file.download_url}'); return false;">${file.path}</a></li>`;
  });
  
  html += '</ul>';
  fileListDiv.innerHTML = html;
}

// 파일 내용 로드 및 표시
async function loadFile(path, downloadUrl) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '<p>Loading...</p>';
  
  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const markdown = await response.text();
    const html = marked.parse(markdown);
    
    contentDiv.innerHTML = `
      <div class="document-viewer">
        <h2>${path}</h2>
        <hr>
        <div class="markdown-content">
          ${html}
        </div>
      </div>
    `;
    
    // 파일 내용으로 스크롤
    contentDiv.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    contentDiv.innerHTML = `<p style="color: red;">Error loading file: ${error.message}</p>`;
  }
}
</script>

<style>
.file-list {
  list-style: none;
  padding: 0;
}

.file-list li {
  margin: 10px 0;
  padding: 10px;
  background: #f6f8fa;
  border-radius: 6px;
  border-left: 3px solid #0366d6;
}

.file-list li:hover {
  background: #e1e4e8;
}

.file-list a {
  text-decoration: none;
  color: #0366d6;
  font-weight: 500;
}

.file-list a:hover {
  text-decoration: underline;
}

.document-viewer {
  margin-top: 30px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
}

.markdown-content {
  margin-top: 20px;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-content code {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-content pre {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
  margin: 16px 0;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}

.markdown-content table th {
  background: #f6f8fa;
  font-weight: 600;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
}

#loading {
  text-align: center;
  padding: 20px;
  color: #586069;
}

#error {
  padding: 20px;
  background: #ffeef0;
  border: 1px solid #d73a49;
  border-radius: 6px;
  margin: 20px 0;
}
</style>
