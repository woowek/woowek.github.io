---
title: 
parent: Documents
layout: default
---

# 

> Source: `kubernetes/cka practice/3. logging and monitoring/1. Monitor Cluster Components.md`

---

3. Deploy the metrics-server by creating all the components downloaded.


Run the kubectl create -f . command from within the downloaded repository.
```
kubectl create -f kubernetes-metrics-server
```



5. Identify the node that consumes the most CPU(cores).
```
kubectl top node
```

7. Identify the POD that consumes the most Memory(bytes) in default namespace.
```
kubectl top pod
```