# Full Stack FastAPI Template

<!--
中文说明（注释）：
本文件下半部分已包含完整中文翻译版本（从 “# Full Stack FastAPI 模板” 开始）。
如需仅保留注释版中文而不保留正文中文，可告知我再帮你改成纯注释形式。
-->

<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3A%22Test+Docker+Compose%22" target="_blank"><img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test%20Docker%20Compose/badge.svg" alt="Test Docker Compose"></a>
<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3A%22Test+Backend%22" target="_blank"><img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test%20Backend/badge.svg" alt="Test Backend"></a>
<a href="https://coverage-badge.samuelcolvin.workers.dev/redirect/fastapi/full-stack-fastapi-template" target="_blank"><img src="https://coverage-badge.samuelcolvin.workers.dev/fastapi/full-stack-fastapi-template.svg" alt="Coverage"></a>

## Technology Stack and Features

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) for the Python backend API.
  - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) for the Python SQL database interactions (ORM).
  - 🔍 [Pydantic](https://docs.pydantic.dev), used by FastAPI, for the data validation and settings management.
  - 💾 [PostgreSQL](https://www.postgresql.org) as the SQL database.
- 🚀 [React](https://react.dev) for the frontend.
  - 💃 Using TypeScript, hooks, [Vite](https://vitejs.dev), and other parts of a modern frontend stack.
  - 🎨 [Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com) for the frontend components.
  - 🤖 An automatically generated frontend client.
  - 🧪 [Playwright](https://playwright.dev) for End-to-End testing.
  - 🦇 Dark mode support.
- 🐋 [Docker Compose](https://www.docker.com) for development and production.
- 🔒 Secure password hashing by default.
- 🔑 JWT (JSON Web Token) authentication.
- 📫 Email based password recovery.
- 📬 [Mailcatcher](https://mailcatcher.me) for local email testing during development.
- ✅ Tests with [Pytest](https://pytest.org).
- 📞 [Traefik](https://traefik.io) as a reverse proxy / load balancer.
- 🚢 Deployment instructions using Docker Compose, including how to set up a frontend Traefik proxy to handle automatic HTTPS certificates.
- 🏭 CI (continuous integration) and CD (continuous deployment) based on GitHub Actions.

### Dashboard Login

[![API docs](img/login.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Admin

[![API docs](img/dashboard.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Items

[![API docs](img/dashboard-items.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Dark Mode

[![API docs](img/dashboard-dark.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Interactive API Documentation

[![API docs](img/docs.png)](https://github.com/fastapi/full-stack-fastapi-template)

## How To Use It

You can **just fork or clone** this repository and use it as is.

✨ It just works. ✨

### How to Use a Private Repository

If you want to have a private repository, GitHub won't allow you to simply fork it as it doesn't allow changing the visibility of forks.

But you can do the following:

- Create a new GitHub repo, for example `my-full-stack`.
- Clone this repository manually, set the name with the name of the project you want to use, for example `my-full-stack`:

```bash
git clone git@github.com:fastapi/full-stack-fastapi-template.git my-full-stack
```

- Enter into the new directory:

```bash
cd my-full-stack
```

- Set the new origin to your new repository, copy it from the GitHub interface, for example:

```bash
git remote set-url origin git@github.com:octocat/my-full-stack.git
```

- Add this repo as another "remote" to allow you to get updates later:

```bash
git remote add upstream git@github.com:fastapi/full-stack-fastapi-template.git
```

- Push the code to your new repository:

```bash
git push -u origin master
```

### Update From the Original Template

After cloning the repository, and after doing changes, you might want to get the latest changes from this original template.

- Make sure you added the original repository as a remote, you can check it with:

```bash
git remote -v

origin    git@github.com:octocat/my-full-stack.git (fetch)
origin    git@github.com:octocat/my-full-stack.git (push)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (fetch)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (push)
```

- Pull the latest changes without merging:

```bash
git pull --no-commit upstream master
```

This will download the latest changes from this template without committing them, that way you can check everything is right before committing.

- If there are conflicts, solve them in your editor.

- Once you are done, commit the changes:

```bash
git merge --continue
```

### Configure

You can then update configs in the `.env` files to customize your configurations.

Before deploying it, make sure you change at least the values for:

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

You can (and should) pass these as environment variables from secrets.

Read the [deployment.md](./deployment.md) docs for more details.

### Generate Secret Keys

Some environment variables in the `.env` file have a default value of `changethis`.

You have to change them with a secret key, to generate secret keys you can run the following command:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the content and use that as password / secret key. And run that again to generate another secure key.

## How To Use It - Alternative With Copier

This repository also supports generating a new project using [Copier](https://copier.readthedocs.io).

It will copy all the files, ask you configuration questions, and update the `.env` files with your answers.

### Install Copier

You can install Copier with:

```bash
pip install copier
```

Or better, if you have [`pipx`](https://pipx.pypa.io/), you can run it with:

```bash
pipx install copier
```

**Note**: If you have `pipx`, installing copier is optional, you could run it directly.

### Generate a Project With Copier

Decide a name for your new project's directory, you will use it below. For example, `my-awesome-project`.

Go to the directory that will be the parent of your project, and run the command with your project's name:

```bash
copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

If you have `pipx` and you didn't install `copier`, you can run it directly:

```bash
pipx run copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

**Note** the `--trust` option is necessary to be able to execute a [post-creation script](https://github.com/fastapi/full-stack-fastapi-template/blob/master/.copier/update_dotenv.py) that updates your `.env` files.

### Input Variables

Copier will ask you for some data, you might want to have at hand before generating the project.

But don't worry, you can just update any of that in the `.env` files afterwards.

The input variables, with their default values (some auto generated) are:

- `project_name`: (default: `"FastAPI Project"`) The name of the project, shown to API users (in .env).
- `stack_name`: (default: `"fastapi-project"`) The name of the stack used for Docker Compose labels and project name (no spaces, no periods) (in .env).
- `secret_key`: (default: `"changethis"`) The secret key for the project, used for security, stored in .env, you can generate one with the method above.
- `first_superuser`: (default: `"admin@example.com"`) The email of the first superuser (in .env).
- `first_superuser_password`: (default: `"changethis"`) The password of the first superuser (in .env).
- `smtp_host`: (default: "") The SMTP server host to send emails, you can set it later in .env.
- `smtp_user`: (default: "") The SMTP server user to send emails, you can set it later in .env.
- `smtp_password`: (default: "") The SMTP server password to send emails, you can set it later in .env.
- `emails_from_email`: (default: `"info@example.com"`) The email account to send emails from, you can set it later in .env.
- `postgres_password`: (default: `"changethis"`) The password for the PostgreSQL database, stored in .env, you can generate one with the method above.
- `sentry_dsn`: (default: "") The DSN for Sentry, if you are using it, you can set it later in .env.

## Backend Development

Backend docs: [backend/README.md](./backend/README.md).

## Frontend Development

Frontend docs: [frontend/README.md](./frontend/README.md).

## Deployment

Deployment docs: [deployment.md](./deployment.md).

## Development

General development docs: [development.md](./development.md).

This includes using Docker Compose, custom local domains, `.env` configurations, etc.

## Release Notes

Check the file [release-notes.md](./release-notes.md).

## License

The Full Stack FastAPI Template is licensed under the terms of the MIT license.

<!--
# Full Stack FastAPI 模板

## 技术栈与功能特性

- ⚡ 使用 [**FastAPI**](https://fastapi.tiangolo.com) 作为 Python 后端 API。
  - 🧰 使用 [SQLModel](https://sqlmodel.tiangolo.com) 进行 Python SQL 数据库交互（ORM）。
  - 🔍 使用 FastAPI 所依赖的 [Pydantic](https://docs.pydantic.dev) 做数据校验与配置管理。
  - 💾 使用 [PostgreSQL](https://www.postgresql.org) 作为 SQL 数据库。
- 🚀 使用 [React](https://react.dev) 构建前端。
  - 💃 使用 TypeScript、hooks、[Vite](https://vitejs.dev) 以及现代前端栈的其他部分。
  - 🎨 使用 [Tailwind CSS](https://tailwindcss.com) 与 [shadcn/ui](https://ui.shadcn.com) 构建前端组件。
  - 🤖 自动生成的前端客户端。
  - 🧪 使用 [Playwright](https://playwright.dev) 进行端到端测试。
  - 🦇 支持暗色模式。
- 🐋 使用 [Docker Compose](https://www.docker.com) 进行开发和生产部署。
- 🔒 默认启用安全密码哈希。
- 🔑 使用 JWT（JSON Web Token）认证。
- 📫 基于邮箱的密码找回。
- 📬 使用 [Mailcatcher](https://mailcatcher.me) 在开发期间进行本地邮件测试。
- ✅ 使用 [Pytest](https://pytest.org) 进行测试。
- 📞 使用 [Traefik](https://traefik.io) 作为反向代理 / 负载均衡器。
- 🚢 提供基于 Docker Compose 的部署说明，包括如何配置前端 Traefik 代理以自动处理 HTTPS 证书。
- 🏭 基于 GitHub Actions 的 CI（持续集成）和 CD（持续部署）。

### 仪表盘登录

[![API docs](img/login.png)](https://github.com/fastapi/full-stack-fastapi-template)

### 仪表盘 - 管理员

[![API docs](img/dashboard.png)](https://github.com/fastapi/full-stack-fastapi-template)

### 仪表盘 - 条目

[![API docs](img/dashboard-items.png)](https://github.com/fastapi/full-stack-fastapi-template)

### 仪表盘 - 暗色模式

[![API docs](img/dashboard-dark.png)](https://github.com/fastapi/full-stack-fastapi-template)

### 交互式 API 文档

[![API docs](img/docs.png)](https://github.com/fastapi/full-stack-fastapi-template)

## 使用方式

你可以**直接 fork 或 clone**这个仓库并按原样使用。

✨ 开箱即用。✨

### 如何使用私有仓库

如果你想把它用在私有仓库中，GitHub 不允许你直接 fork 后再修改可见性（fork 的可见性不能随意变更）。

你可以这样做：

- 新建一个 GitHub 仓库，例如 `my-full-stack`。
- 手动克隆本仓库，并将本地目录命名为你想用的项目名，例如 `my-full-stack`：

```bash
git clone git@github.com:fastapi/full-stack-fastapi-template.git my-full-stack
```

- 进入新目录：

```bash
cd my-full-stack
```

- 将 origin 修改为你的新仓库地址（从 GitHub 页面复制），例如：

```bash
git remote set-url origin git@github.com:octocat/my-full-stack.git
```

- 将本模板仓库添加为另一个 `remote`，便于后续同步更新：

```bash
git remote add upstream git@github.com:fastapi/full-stack-fastapi-template.git
```

- 将代码推送到你的新仓库：

```bash
git push -u origin master
```

### 从原始模板更新

克隆仓库并做了修改后，你可能希望同步这个模板的最新改动。

- 确认你已将原始仓库添加为 remote，可用以下命令检查：

```bash
git remote -v

origin    git@github.com:octocat/my-full-stack.git (fetch)
origin    git@github.com:octocat/my-full-stack.git (push)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (fetch)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (push)
```

- 拉取最新改动但先不自动合并提交：

```bash
git pull --no-commit upstream master
```

这会先下载模板最新改动但不立即提交，方便你在提交前确认一切正确。

- 如果有冲突，在编辑器中解决冲突。

- 完成后，提交合并：

```bash
git merge --continue
```

### 配置

然后你可以在 `.env` 文件中更新配置来自定义项目参数。

部署前，至少要修改以下值：

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

你可以（也建议）通过密钥管理系统以环境变量方式传入这些值。

更多细节请阅读 [deployment.md](./deployment.md)。

### 生成密钥

`.env` 文件中的一些环境变量默认值为 `changethis`。

你需要把它们改成真正的密钥。可用以下命令生成：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

复制输出结果作为密码 / 密钥使用。然后再执行一次，生成另一把安全密钥。

## 另一种使用方式：通过 Copier

本仓库也支持用 [Copier](https://copier.readthedocs.io) 生成新项目。

它会复制全部文件，向你提问配置项，并根据你的回答更新 `.env` 文件。

### 安装 Copier

你可以通过以下命令安装 Copier：

```bash
pip install copier
```

或者更推荐，如果你有 [`pipx`](https://pipx.pypa.io/)，可使用：

```bash
pipx install copier
```

**注意**：如果你有 `pipx`，安装 copier 不是必须的，可以直接运行。

### 使用 Copier 生成项目

先决定新项目目录名，下面会用到。例如：`my-awesome-project`。

进入作为该项目父目录的位置，执行下面命令（把项目名替换成你的）：

```bash
copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

如果你有 `pipx` 且未安装 `copier`，也可以直接运行：

```bash
pipx run copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

**注意**：`--trust` 选项是必须的，用于执行一个[创建后脚本](https://github.com/fastapi/full-stack-fastapi-template/blob/master/.copier/update_dotenv.py)，该脚本会更新你的 `.env` 文件。

### 输入变量

Copier 会询问一些参数，建议在生成项目前先准备好。

不过不用担心，之后你仍可在 `.env` 文件中修改这些值。

输入变量及其默认值（部分会自动生成）如下：

- `project_name`：（默认：`"FastAPI Project"`）项目名称，会展示给 API 使用者（存于 `.env`）。
- `stack_name`：（默认：`"fastapi-project"`）用于 Docker Compose 标签与项目名的栈名称（不能有空格和句点）（存于 `.env`）。
- `secret_key`：（默认：`"changethis"`）项目密钥，用于安全相关功能，存于 `.env`，可按上文方法生成。
- `first_superuser`：（默认：`"admin@example.com"`）第一个超级管理员邮箱（存于 `.env`）。
- `first_superuser_password`：（默认：`"changethis"`）第一个超级管理员密码（存于 `.env`）。
- `smtp_host`：（默认：`""`）用于发信的 SMTP 服务器地址，可后续在 `.env` 中设置。
- `smtp_user`：（默认：`""`）用于发信的 SMTP 用户名，可后续在 `.env` 中设置。
- `smtp_password`：（默认：`""`）用于发信的 SMTP 密码，可后续在 `.env` 中设置。
- `emails_from_email`：（默认：`"info@example.com"`）发件邮箱地址，可后续在 `.env` 中设置。
- `postgres_password`：（默认：`"changethis"`）PostgreSQL 数据库密码，存于 `.env`，可按上文方法生成。
- `sentry_dsn`：（默认：`""`）Sentry 的 DSN（如需使用），可后续在 `.env` 中设置。

## 后端开发

后端文档： [backend/README.md](./backend/README.md)。

## 前端开发

前端文档： [frontend/README.md](./frontend/README.md)。

## 部署

部署文档： [deployment.md](./deployment.md)。

## 开发

通用开发文档： [development.md](./development.md)。

其中包括 Docker Compose、本地域名、`.env` 配置等内容。

## 发布说明

请查看 [release-notes.md](./release-notes.md)。

## 许可证

Full Stack FastAPI Template 采用 MIT 许可证授权。
-->
