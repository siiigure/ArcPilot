# RAGFlow 放进项目里之后 —— 接下来做什么

## 把源码放进 folder 有用吗？

**有用。** 可以：

- 在本地用 **Docker** 一键跑起 RAGFlow（推荐）
- 需要时用**源码**调试或改 RAGFlow
- 在 ArcPilot 的 **backend** 里参考/调用 RAGFlow 的 **API** 或 **Python SDK**

---

## 第一步：先把 RAGFlow 跑起来（Docker，最简单）

### 1. 环境要求

- CPU ≥ 4 核，内存 ≥ 16 GB，磁盘 ≥ 50 GB  
- 已安装 **Docker** 和 **Docker Compose**

### 2. 在 Windows 上

在 **PowerShell** 或 **CMD** 里执行：

```bash
cd d:\ArcPilot\ragflow-main\ragflow-main\docker

# 必须同时加 elasticsearch 和 cpu，否则 RAGFlow 连不上 ES，会 502
docker compose -f docker-compose.yml --profile elasticsearch --profile cpu up -d
```

> 若拉镜像很慢，可编辑 `docker\.env`，把 `RAGFLOW_IMAGE` 改成华为云/阿里云镜像（文件里有注释）。

### 3. 等服务就绪

第一次会拉镜像、起 MySQL / Elasticsearch / MinIO / Redis 等，可能要几分钟。看日志：

```bash
docker compose -f docker-compose.yml --profile cpu logs -f
```

### 4. 访问 RAGFlow

- 浏览器打开：**http://127.0.0.1** 或 **http://localhost**（端口以 docker-compose 里 `SVR_WEB_HTTP_PORT` 为准，默认 80）
- 首次打开会要求**注册账号**，按提示即可

---

## 第二步：在 ArcPilot 里用 RAGFlow

RAGFlow 跑起来后，会提供 **HTTP API**（一般在本机是 `http://127.0.0.1:9380`，见 docker 里 `SVR_HTTP_PORT`）。

在 **ArcPilot 的 backend**（`backend/main.py` 或你新建的模块）里可以：

1. **用 HTTP 调 API**  
   - 文档：<https://ragflow.io/docs/references/http_api_reference>  
   - 把「上传文档、建知识库、检索、对话」等请求发到 `http://127.0.0.1:9380`

2. **用官方 Python SDK**（你项目里已有）  
   - 路径：`ragflow-main/ragflow-main/sdk/python/`  
   - 示例：`ragflow-main/ragflow-main/example/sdk/dataset_example.py`  
   - 在 `backend/requirements.txt` 里可以加对本地 sdk 的依赖，或在 backend 里把 RAGFlow API 的 base URL 配成 `http://127.0.0.1:9380` 再调用

这样，ArcPilot 前端 → 你的 FastAPI 后端 → RAGFlow，就串起来了。

---

## 第三步：可选整理

- **不想把 RAGFlow 源码提交到 GitHub**：在项目根目录的 `.gitignore` 里加一行：  
  `ragflow-main/`
- **想和 ArcPilot 一起“一键起服”**：可以写一个脚本，先 `docker compose` 起 RAGFlow，再 `npm run dev` 起前端+后端；或把这两步写进根目录 `package.json` 的 `scripts` 里（例如 `"dev:all"`）。

---

## 常用命令小结

| 你想做           | 命令 |
|------------------|------|
| 启动 RAGFlow     | `cd ragflow-main\ragflow-main\docker` → `docker compose -f docker-compose.yml --profile cpu up -d` |
| 看 RAGFlow 日志  | `cd ragflow-main\ragflow-main\docker` → `docker compose -f docker-compose.yml logs -f` |
| 停止 RAGFlow     | `cd ragflow-main\ragflow-main\docker` → `docker compose -f docker-compose.yml --profile cpu down` |

按上面顺序：**先 Docker 跑起来 → 再在 ArcPilot backend 里调 API/SDK**，就是接下来该做的事。
