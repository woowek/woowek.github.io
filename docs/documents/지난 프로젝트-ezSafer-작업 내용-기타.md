---
title: 
parent: Documents
layout: default
---

# 

> Source: `지난 프로젝트/ezSafer/작업 내용/기타.md`

---

>memory heap error 관련
----------
1. heap Memory 확인
```cmd
$jmap -heap 톰캣PID
```


2. heap Memory 설정
- tomcat bin 폴더에 setenv.sh 파일 생성 및 저장 후 재실행
```cmd
export CATALINA_OPTS="$CATALINA_OPTS -Xms256m"
export CATALINA_OPTS="$CATALINA_OPTS -Xmx4096m"
```