# ArcPilot
ArcPilot 是一个**面向地理信息与专业知识的社区 + AI 助手**平台：用户可以在带空间信息的帖子中讨论与协作，同时通过 AI 会话获得带引用与可追溯答案的辅助（设计上与 RAG / 知识库能力对接，例如数据模型中的 RAG 追踪与引用实体）。
---

## 项目要做什么
| 方向 | 说明 |
|------|------|
| **社区** | 帖子、回复、点赞、标签；帖子可关联 **PostGIS** 几何字段，支持地理相关场景。 |
| **用户与准入** | 用户资料、邀请码注册与状态流转。 |
| **AI 助手** | 会话、多轮消息、结构化答案（含校验与风险标记）、**引用（Citation）**（URL / 对象存储等来源）、用量配额。 |
| **前端体验** | 认证、Feed、话题、搜索、个人页与设置、AI 聊天与引用详情等路由与导航（详见 `docs/plans/` 中的页面方案）。 |
当前仓库中**后端 API 仍在搭建**（`backend/main.py` 为最小 FastAPI 入口），**数据模型与库表设计**已在 `backend/models.py` 等处体现产品方向。

---
## 语言与技术栈

| 层级 | 技术 |
|------|------|
| **前端** | **TypeScript**、**React 19**、**Next.js**（App Router）、**Tailwind CSS** |
| **后端** | **Python 3**、**FastAPI**、**Uvicorn** |
| **数据与 ORM** | **PostgreSQL** + **PostGIS**、**SQLModel**（基于 SQLAlchemy）、**GeoAlchemy2**（空间字段） |
| **根目录脚本** | **Node.js**（`concurrently` 同时拉起前后端开发进程） |
---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     浏览器 / 客户端                           │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP
┌─────────────────────────────▼───────────────────────────────┐
│  frontend/          Next.js + React（UI、路由、主题等）       │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST（演进中）
┌─────────────────────────────▼───────────────────────────────┐
│  backend/           FastAPI 应用 + 业务与持久化               │
│                     SQLModel → PostgreSQL/PostGIS             │
└─────────────────────────────────────────────────────────────┘
```

- **前后端分离**：独立仓库路径 `frontend/` 与 `backend/`，开发时由根目录脚本并行启动。
- **数据层**：连接串默认指向本地 Postgres/PostGIS（可通过环境变量覆盖），建表由 SQLModel metadata 驱动；启用空间能力需在库中安装 PostGIS 扩展。
- **RAG / 知识库**：产品模型包含 `ragflow_trace_id` 等字段；若仓库中存在 `ragflow-main/` 等目录，通常作为 **RAGFlow 相关参考或本地依赖**，与 ArcPilot 应用代码区分看待。

---

## 本地开发

**安装依赖（前后端）：**

```bash
npm run install-all
```

**同时启动前端与后端：**

```bash
npm run dev
```

- 前端：默认 Next 开发端口（见终端输出）。
- 后端：`python3 backend/main.py`，默认监听 `http://0.0.0.0:8000`。

单独运行：`npm run dev:frontend` / `npm run dev:backend`。

---

## 数据库环境变量（节选）

可通过环境变量覆盖默认连接（详见 `backend/database.py`）：

| 变量 | 含义 |
|------|------|
| `DATABASE_URL` | 完整连接串（若设置则优先于下列分项） |
| `ARCPILOT_DB_USER` / `ARCPILOT_DB_PASSWORD` / `ARCPILOT_DB_HOST` / `ARCPILOT_DB_PORT` / `ARCPILOT_DB_NAME` | 分项配置 |

首次使用前请在目标数据库执行：`CREATE EXTENSION IF NOT EXISTS postgis;`（与代码注释一致）。

### Docker（可选，提这一点就够了）

- **为什么可能用到**：本机不想装全局 PostgreSQL 时，用 Docker 跑带 **PostGIS** 的镜像很常见。应用并不「依赖 Docker」——只要有一个可连上的 Postgres/PostGIS，装在宿主机或容器里都行。
- **怎么对上 ArcPilot**：默认连接逻辑在 `backend/database.py`；容器若把 5432 映射到宿主机，用 `ARCPILOT_DB_HOST` / `ARCPILOT_DB_PORT` 或一条 `DATABASE_URL` 指过去即可。
- **本仓库**：根目录**没有**为 ArcPilot 单独维护 `docker-compose`；你若自建「只起数据库」的 compose，属于本地偏好，不必和前后端绑死。
- **RAGFlow**：若使用 `ragflow-main/` 里的 RAGFlow，其官方用法多为 Docker 编排，与 ArcPilot 的 `npm run dev` 是**两套进程**，各自按对应目录的说明启动即可。

---

## 文档

- `docs/plans/前端页面结构与跳转逻辑.md` — 路由与导航规划  
- `docs/plans/数据库逻辑模型.md` — 与实体设计对应的说明  

---

## 许可

若需对外分发，请在仓库根目录补充 `LICENSE` 并在此更新说明。
