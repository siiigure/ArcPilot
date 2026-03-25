## 社区闭环 MVP（先正文后 AI）流程图与可验收步骤

### 范围约定
- 目标闭环：`首页 Feed -> 发帖(/post/new) -> 帖子详情(/post/{id}) -> 回帖 -> 刷新仍存在`
- 显示优先级：**详情页先展示正文（title + body + 作者信息），回复列表放正文下方**；tag 在本 MVP 不展示（后续再完善）。
- 计数规则：`PostCard.comments` = 该帖 `replies` 条数。
- 字段命名：前端期望 `post.author.avatar` / `post.author.bio`；avatar 缺失时由前端使用 dicebear 默认头像兜底（seed 用 `author.name`）。

### Mermaid 流程图
> 直接复制到支持 Mermaid 的渲染器即可看到图；也可在 Cursor/IDE 中预览。

```mermaid
flowchart TD
  A[准备阶段：确定 MVP 字段契约与验收点] --> B[后端：补齐 Tag/Post/Reply API]
  B --> C{验收：Swagger 能通？}
  C -->|未通过| B
  C -->|通过| D[生成前端 OpenAPI client]
  D --> E[前端：实现三段页面接入]
  E --> F{验收：UI 闭环能走通？}
  F -->|未通过| E
  F -->|通过| G[验证持久化：刷新仍存在]
  G --> H[里程碑完成：社区闭环 MVP 可用]

  subgraph 后端接口最小集合
    B1[GET /tags] 
    B2[POST /posts]
    B3[GET /posts/{id}]
    B4[GET /posts/{id}/replies]
    B5[POST /posts/{id}/replies]
  end

  subgraph 前端最小页面集合
    E1[首页：用 GET /posts 替换 DEMO_POSTS]
    E2[发帖页：加载 GET /tags，提交 POST /posts -> 跳转 /post/{id}]
    E3[详情页：GET /posts/{id} 展示正文；GET /posts/{id}/replies 展示回复列表]
    E4[回帖提交：POST /posts/{id}/replies 成功后重新拉 replies]
  end

  B --> B1 --> B2 --> B3 --> B4 --> B5
  E --> E1 --> E2 --> E3 --> E4
```

### 详细可执行步骤（后端 -> 前端 -> 联调）

#### 0. 你必须确认的“契约”，否则容易返工
1. 详情页先展示：`title + content(body) + author(name/avatar/bio 可选)`，**tag 在 MVP 不展示**（API 可返回空数组即可）。
2. 列表页 `PostCard.comments` 的来源：必须来自 replies 数（不要写死 demo）。
3. 头像兜底：当后端返回 `author.avatar` 为空/缺失时，前端生成 dicebear 默认头像（seed = `author.name`）。
4. replies 顺序：MVP 默认按 `created_at` 降序（新->旧），新回复在列表顶部。
5. 鉴权策略：社区相关 **读取** 接口按 `auth_required` 处理（前端通过 `/_layout` 已登录重定向，闭环路径不受影响）。
6. 社区统计字段：`shares` 在 MVP 先 `omit`（不要返回 `shares=0`），避免前端误显示“shares”相关 UI。

#### 1. 后端：补齐社区主链路 API（按顺序做，边做边在 /docs 验收）
1.1 先做 Tag
- `GET /api/v1/tags`
- 验收：返回 `data` 非空（因为你选了“必须支持 tag 选择”）。
- 如果返回为空：先在 `initial_data.py` / prestart 初始化里 seed 至少 3 个 tag。

1.2 再做 Post（列表 + 创建 + 详情）
- `POST /api/v1/posts`
  - 接收字段（MVP）：`title, body, tag_ids(可为空但 UI 会传)`
  - 写入：`post.author_id`（用 `CurrentUser`），并创建 `post_tag_link` 关联。
- `GET /api/v1/posts`
  - 返回列表字段：`id,title,content,created_at/timestamp,upvotes(=0),comments(=reply_count),author{name,avatar?,bio?}`
  - 其中 `comments` 必须 = replies 数（可以用聚合 count 或两次查询，MVP 允许实现简单）。
- `GET /api/v1/posts/{id}`
  - 返回详情字段：`id,title,content,created_at/timestamp,author...,tags(可先空数组)`

验收点：
- Swagger 中：创建一条 post 后能立刻通过 `GET /posts` 和 `GET /posts/{id}` 查到对应内容。

1.3 最后做 Reply（详情页 replies：列表 + 创建）
- `GET /api/v1/posts/{id}/replies`（按 created_at 升序）
- `POST /api/v1/posts/{id}/replies`
  - 接收字段（MVP）：`body`
  - 写入：`reply.post_id` + `reply.author_id`（CurrentUser）。

验收点：
- 创建一条 reply 后，再 `GET /posts/{id}/replies` 能看到新回复。
- 同时确保 `GET /posts` 中该 post 的 `comments` 增加 1。

#### 2. 后端：为前端字段准备“作者信息”
2.1 你选择的是“前端兜底头像”，因此后端作者信息只需要保证：
- `author.name` 必须可用（建议用 `full_name || email`）
- `author.avatar`/`author.bio` 可以为空/缺失

2.2 但要注意：你的前端 `PostCard` 如果直接把 `author.avatar` 当 `<img src>`，需要前端兜底逻辑不报错。

#### 3. 每次改动后端 schema/接口：必须生成前端 OpenAPI client
- 执行：`bash ./scripts/generate-client.sh`
- 验收：前端能编译通过，并且调用新接口类型不报错。

#### 4. 前端：实现闭环三段页面（MVP 最小）
4.1 首页 Feed（替换 mock）
- 将 `/_layout/index.tsx` 的 `DEMO_POSTS` 渲染替换为调用 `GET /posts`
- 验收：刷新首页后列表来自后端真实数据；comments = replies 条数

4.2 发帖页 `/post/new`
- 页面加载：`GET /tags` 拉取 tag 列表用于多选
- 表单提交：提交 `title/body/tag_ids` 调用 `POST /posts`
- 提交成功：跳转 `/post/{id}`
- 验收：创建的内容在详情页可见

4.3 帖子详情页 `/post/{id}`（先正文，再回复）
- 首屏：调用 `GET /posts/{id}` 展示正文（title + body）和作者信息
- replies 区域：调用 `GET /posts/{id}/replies` 展示回复列表
- 回帖提交：调用 `POST /posts/{id}/replies`
- 回帖成功后：**重新拉 `GET /posts/{id}/replies`**（符合“刷新仍存在”验收点）
- 验收：你刷新浏览器，回复仍在

### MVP 完成定义（最终验收清单）
1. 你从首页进入发帖页，成功创建一条 post。
2. 创建后跳转详情页，正文展示正确。
3. 在详情页发布一条 reply，reply 展示正确。
4. 刷新页面后，reply 仍然存在（来自后端数据，而非仅前端本地状态）。
5. 首页列表中该帖 `comments` 与 replies 数一致。





后端：先把社区闭环最小 API 跑通（必须）
目标：Swagger /docs 里你能完成 Tag seed -> 创建 post -> 拉列表与详情 -> 创建 reply -> 拉 replies。

先 seed Tag（因为你选了 tag 多选 1B）
改文件：arcpilot/backend/app/initial_data.py
做什么：启动初始化时至少创建 3 个 Tag
验收：调用 GET /api/v1/tags 返回非空
新增社区路由文件（建议）
新文件：arcpilot/backend/app/api/routes/posts.py
需要实现 5 个端点（MVP）：
GET /api/v1/tags
POST /api/v1/posts（payload 接收 title/body/tag_ids，写入 author_id）
GET /api/v1/posts（用于首页 Feed 列表）
GET /api/v1/posts/{id}（用于详情页“正文优先”）
GET /api/v1/posts/{id}/replies（详情页 replies 区域，按 created_at 降序）
POST /api/v1/posts/{id}/replies（发布回复，创建后前端会重新拉 replies）
把新路由挂到主路由
改文件：arcpilot/backend/app/api/main.py
做什么：把 posts.router include 进去
输出字段映射（这是闭环最容易踩坑的点） 你的前端 PostCard 期待字段（来自 frontend/src/types/index.ts）是：
post.content（正文），而后端模型字段是 Post.body：需要在响应模型里映射成 content
post.timestamp（时间字符串），而后端是 created_at：需要映射成 timestamp
post.upvotes：MVP 给 0
post.comments：必须等于 replies 条数（你确认了回复条数口径）
author.name 必须存在；author.avatar/bio 可以为空（前端 dicebear 兜底，你选的是 A）
验收：在 Swagger 里用 Postman/Swagger 手动：

创建 post 后 GET /posts 和 GET /posts/{id} 都能看到“正文 content + 作者信息 + comments 正确增加”
前端 OpenAPI client 生成（每次后端接口/Schema 变化必须做）
执行命令：bash ./scripts/generate-client.sh
验收：前端能编译通过
前端：实现 3 段页面接入并替换 mock（必须）
目标：用户视角从首页进发帖页、再到详情页发回复，并且刷新回复仍存在。

首页 Feed 替换 mock
改文件：arcpilot/frontend/src/routes/_layout/index.tsx
做什么：把 DEMO_POSTS 换成调用 GET /posts 的结果渲染
验收：comments 显示与该贴 replies 数一致
发帖页 /post/new
新文件（建议路径）：arcpilot/frontend/src/routes/_layout/post/new.tsx
做什么：
页面加载拉 GET /tags 填充多选
提交时调用 POST /posts，payload 含 title/body/tag_ids
成功后跳转 /post/{id}
验收：新帖正文在详情页可见（tags MVP 可不展示，但 tag_ids 要落库）
帖子详情页 /post/{id}（先展示正文，再 replies）
新文件（动态段）：arcpilot/frontend/src/routes/_layout/post/$id.tsx
做什么（严格按顺序）：
首屏先调用 GET /posts/{id} 展示正文（title + content）
replies 区域再调用 GET /posts/{id}/replies 展示回复列表（按你选择：降序，新回复在顶部）
提交回复后必须重新拉 GET /posts/{id}/replies（确保刷新仍存在）
验收：发布回复后刷新页面仍能看到新回复
PostCard 作者头像兜底（你选了 dicebear）
改文件：arcpilot/frontend/src/components/feed/PostCard.tsx
做什么：当 post.author.avatar 为空时，用 dicebear 默认头像生成（seed = post.author.name）
验收：没有 avatar 的用户也能正常渲染头像，不报错不空白
最后：社区闭环 MVP 验收（你照着点就行）
首页能看到后端真实 posts 列表
点击入口进入 /post/new，tag 多选可用，提交后跳到 /post/{id}
/post/{id} 首屏展示正文
在详情页发布 1 条回复
刷新浏览器后，回复仍然存在（说明持久化闭环跑通）
首页该帖 comments 的数字随回复数量变化