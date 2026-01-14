---
title: 
parent: Documents
layout: default
---

# 

> Source: `지난 프로젝트/한국해양교통안전공단/개인 작업/div 페이지 이동.md`

---

Div 페이지 이동
===
>
---
- 저번엔 ajax 쓰다가 새로고침 등의 이슈가 았어 이쪽이 쓰는데 훨씬 안정적일거 같다.
```js
bipMnvMainPage.callPortlet = function (portletId, url) {
    $("#" + portletId).children().remove();
    $("#" + portletId).load(url);
}
```