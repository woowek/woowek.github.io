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

<link rel="stylesheet" href="{{ '/assets/css/document-viewer.css' | relative_url }}">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="{{ '/assets/js/document-viewer.js' | relative_url }}"></script>

