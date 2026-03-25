# FastAPI Project - Frontend

<!--
中文翻译（注释版）

# FastAPI 项目 - 前端

前端基于 Vite、React、TypeScript、TanStack Query、TanStack Router 与 Tailwind CSS 构建。

## 环境要求
- 推荐安装 Bun，也可使用 Node.js。

## 快速开始
```bash
bun install
bun run dev
```
- 启动后访问 http://localhost:5173/ 。
- 这是本地开发服务器（非 Docker），推荐用于日常开发；确认功能后再构建 Docker 镜像做接近生产环境的验证。
- 其他可用脚本可查看 `package.json`。

### 移除前端（仅 API 项目）
- 删除 `./frontend` 目录。
- 在 `compose.yml` 中删除 `frontend` 服务。
- 在 `compose.override.yml` 中删除 `frontend` 与 `playwright` 服务。
- 若需要清理，可同时移除 `.env` 与 `./scripts/*.sh` 中的 FRONTEND 相关环境变量（不删通常也不影响运行）。

## 生成前端客户端（OpenAPI Client）

### 自动方式
- 先激活后端虚拟环境。
- 在项目根目录执行：
```bash
bash ./scripts/generate-client.sh
```
- 提交生成后的改动。

### 手动方式
- 先启动 Docker Compose。
- 下载 `http://localhost/api/v1/openapi.json` 到 `frontend/openapi.json`。
- 执行：
```bash
bun run generate-client
```
- 提交改动。
- 每次后端 OpenAPI 结构变化后，都需要重新生成客户端。

## 使用远程 API
- 在 `frontend/.env` 中设置：
```env
VITE_API_URL=https://api.my-domain.example.com
```
- 前端启动后会把该地址作为 API 基础 URL。

## 代码结构
- `frontend/src`：前端主代码
- `frontend/src/assets`：静态资源
- `frontend/src/client`：生成的 OpenAPI 客户端
- `frontend/src/components`：前端组件
- `frontend/src/hooks`：自定义 Hooks
- `frontend/src/routes`：页面路由

## 使用 Playwright 进行端到端测试
- 先启动后端相关栈：
```bash
docker compose up -d --wait backend
```
- 运行测试：
```bash
bunx playwright test
```
- 以 UI 模式运行：
```bash
bunx playwright test --ui
```
- 停止并清理测试数据：
```bash
docker compose down -v
```
- 修改或新增测试文件：在 tests 目录进行。
- 参考 Playwright 官方文档获取更多细节。
-->

The frontend is built with [Vite](https://vitejs.dev/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [TanStack Query](https://tanstack.com/query), [TanStack Router](https://tanstack.com/router) and [Tailwind CSS](https://tailwindcss.com/).

## Requirements

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/)

## Quick Start

```bash
bun install
bun run dev
```

* Then open your browser at http://localhost:5173/.

Notice that this live server is not running inside Docker, it's for local development, and that is the recommended workflow. Once you are happy with your frontend, you can build the frontend Docker image and start it, to test it in a production-like environment. But building the image at every change will not be as productive as running the local development server with live reload.

Check the file `package.json` to see other available options.

### Removing the frontend

If you are developing an API-only app and want to remove the frontend, you can do it easily:

* Remove the `./frontend` directory.

* In the `compose.yml` file, remove the whole service / section `frontend`.

* In the `compose.override.yml` file, remove the whole service / section `frontend` and `playwright`.

Done, you have a frontend-less (api-only) app. 🤓

---

If you want, you can also remove the `FRONTEND` environment variables from:

* `.env`
* `./scripts/*.sh`

But it would be only to clean them up, leaving them won't really have any effect either way.

## Generate Client

### Automatically

* Activate the backend virtual environment.
* From the top level project directory, run the script:

```bash
bash ./scripts/generate-client.sh
```

* Commit the changes.

### Manually

* Start the Docker Compose stack.

* Download the OpenAPI JSON file from `http://localhost/api/v1/openapi.json` and copy it to a new file `openapi.json` at the root of the `frontend` directory.

* To generate the frontend client, run:

```bash
bun run generate-client
```

* Commit the changes.

Notice that everytime the backend changes (changing the OpenAPI schema), you should follow these steps again to update the frontend client.

## Using a Remote API

If you want to use a remote API, you can set the environment variable `VITE_API_URL` to the URL of the remote API. For example, you can set it in the `frontend/.env` file:

```env
VITE_API_URL=https://api.my-domain.example.com
```

Then, when you run the frontend, it will use that URL as the base URL for the API.

## Code Structure

The frontend code is structured as follows:

* `frontend/src` - The main frontend code.
* `frontend/src/assets` - Static assets.
* `frontend/src/client` - The generated OpenAPI client.
* `frontend/src/components` -  The different components of the frontend.
* `frontend/src/hooks` - Custom hooks.
* `frontend/src/routes` - The different routes of the frontend which include the pages.

## End-to-End Testing with Playwright

The frontend includes initial end-to-end tests using Playwright. To run the tests, you need to have the Docker Compose stack running. Start the stack with the following command:

```bash
docker compose up -d --wait backend
```

Then, you can run the tests with the following command:

```bash
bunx playwright test
```

You can also run your tests in UI mode to see the browser and interact with it running:

```bash
bunx playwright test --ui
```

To stop and remove the Docker Compose stack and clean the data created in tests, use the following command:

```bash
docker compose down -v
```

To update the tests, navigate to the tests directory and modify the existing test files or add new ones as needed.

For more information on writing and running Playwright tests, refer to the official [Playwright documentation](https://playwright.dev/docs/intro).
