# FastAPI Project - Backend

<!--
中文翻译（注释版）

# FastAPI 项目 - 后端

## 环境要求
- Docker
- uv（用于 Python 依赖与虚拟环境管理）

## Docker Compose
- 按 `../development.md` 指南启动本地开发环境。

## 通用开发流程
- 使用 uv 管理依赖。
- 在 `./backend/` 执行：
```console
$ uv sync
```
- 激活虚拟环境：
```console
$ source .venv/bin/activate
```
- 编辑器解释器请指向 `backend/.venv/bin/python`。
- 主要代码位置：
  - 数据模型与表：`./backend/app/models/`
  - API 路由：`./backend/app/api/`
  - CRUD：`./backend/app/crud.py`

## VS Code
- 已预置调试配置，可使用断点、变量观察等。
- 已预置测试配置，可在 VS Code Python Tests 面板运行测试。

## Docker Compose Override
- 可在 `compose.override.yml` 中添加仅本地生效的开发配置，不影响生产环境。
- 当前配置支持将本地后端代码同步进容器，提升迭代效率。
- 还覆盖了命令为 `fastapi run --reload`，代码变更会自动重载。
- 若出现语法错误导致进程退出，修复后重新执行：
```console
$ docker compose watch
```
- 也可改成“保持容器常驻但不执行业务命令”的方式，再进容器手动运行命令，便于调试。
- 进入容器：
```console
$ docker compose watch
$ docker compose exec backend bash
```
- 在容器中运行热重载服务：
```console
$ fastapi run --reload app/main.py
```

## 后端测试
- 执行：
```console
$ bash ./scripts/test.sh
```
- 测试基于 Pytest，测试文件在 `./backend/tests/`。
- 使用 GitHub Actions 时会自动跑测试。

### 对已运行中的栈执行测试
```bash
docker compose exec backend bash scripts/tests-start.sh
```
- 可附加 pytest 参数，例如首错即停：
```bash
docker compose exec backend bash scripts/tests-start.sh -x
```

### 覆盖率
- 测试后会生成 `htmlcov/index.html`，可在浏览器查看覆盖率报告。

## 数据库迁移（Migrations）
- 本地开发时 `app` 目录挂载进容器，可在容器内执行 alembic 并把迁移文件保存在项目里。
- 每次模型变更后应：
  1) 生成 revision
  2) 执行 upgrade 更新数据库结构
- 进入容器：
```console
$ docker compose exec backend bash
```
- 生成迁移：
```console
$ alembic revision --autogenerate -m "Add column last_name to User model"
```
- 执行迁移：
```console
$ alembic upgrade head
```
- 请把 alembic 生成的迁移文件提交到 Git。
- 若完全不想用迁移，可启用 `SQLModel.metadata.create_all(engine)`，并注释 `scripts/prestart.sh` 里的 `alembic upgrade head`。
- 若要从零开始且没有历史 revision，可删除 `./backend/app/alembic/versions/` 下旧迁移文件后重新创建首个迁移。

## 邮件模板
- 模板位于 `./backend/app/email-templates/`：
  - `src`：源 MJML
  - `build`：应用实际使用的 HTML
- 先安装 VS Code 的 MJML 扩展。
- 新建/修改 `.mjml` 后，执行 `MJML: Export to HTML`，再把导出的 `.html` 保存到 `build` 目录。
-->

## Requirements

* [Docker](https://www.docker.com/).
* [uv](https://docs.astral.sh/uv/) for Python package and environment management.

## Docker Compose

Start the local development environment with Docker Compose following the guide in [../development.md](../development.md).

## General Workflow

By default, the dependencies are managed with [uv](https://docs.astral.sh/uv/), go there and install it.

From `./backend/` you can install all the dependencies with:

```console
$ uv sync
```

Then you can activate the virtual environment with:

```console
$ source .venv/bin/activate
```

Make sure your editor is using the correct Python virtual environment, with the interpreter at `backend/.venv/bin/python`.

Modify or add SQLModel models for data and SQL tables in `./backend/app/models/`, API endpoints in `./backend/app/api/`, CRUD (Create, Read, Update, Delete) utils in `./backend/app/crud.py`.

## VS Code

There are already configurations in place to run the backend through the VS Code debugger, so that you can use breakpoints, pause and explore variables, etc.

The setup is also already configured so you can run the tests through the VS Code Python tests tab.

## Docker Compose Override

During development, you can change Docker Compose settings that will only affect the local development environment in the file `compose.override.yml`.

The changes to that file only affect the local development environment, not the production environment. So, you can add "temporary" changes that help the development workflow.

For example, the directory with the backend code is synchronized in the Docker container, copying the code you change live to the directory inside the container. That allows you to test your changes right away, without having to build the Docker image again. It should only be done during development, for production, you should build the Docker image with a recent version of the backend code. But during development, it allows you to iterate very fast.

There is also a command override that runs `fastapi run --reload` instead of the default `fastapi run`. It starts a single server process (instead of multiple, as would be for production) and reloads the process whenever the code changes. Have in mind that if you have a syntax error and save the Python file, it will break and exit, and the container will stop. After that, you can restart the container by fixing the error and running again:

```console
$ docker compose watch
```

There is also a commented out `command` override, you can uncomment it and comment the default one. It makes the backend container run a process that does "nothing", but keeps the container alive. That allows you to get inside your running container and execute commands inside, for example a Python interpreter to test installed dependencies, or start the development server that reloads when it detects changes.

To get inside the container with a `bash` session you can start the stack with:

```console
$ docker compose watch
```

and then in another terminal, `exec` inside the running container:

```console
$ docker compose exec backend bash
```

You should see an output like:

```console
root@7f2607af31c3:/app#
```

that means that you are in a `bash` session inside your container, as a `root` user, under the `/app` directory, this directory has another directory called "app" inside, that's where your code lives inside the container: `/app/app`.

There you can use the `fastapi run --reload` command to run the debug live reloading server.

```console
$ fastapi run --reload app/main.py
```

...it will look like:

```console
root@7f2607af31c3:/app# fastapi run --reload app/main.py
```

and then hit enter. That runs the live reloading server that auto reloads when it detects code changes.

Nevertheless, if it doesn't detect a change but a syntax error, it will just stop with an error. But as the container is still alive and you are in a Bash session, you can quickly restart it after fixing the error, running the same command ("up arrow" and "Enter").

...this previous detail is what makes it useful to have the container alive doing nothing and then, in a Bash session, make it run the live reload server.

## Backend tests

To test the backend run:

```console
$ bash ./scripts/test.sh
```

The tests run with Pytest, modify and add tests to `./backend/tests/`.

If you use GitHub Actions the tests will run automatically.

### Test running stack

If your stack is already up and you just want to run the tests, you can use:

```bash
docker compose exec backend bash scripts/tests-start.sh
```

That `/app/scripts/tests-start.sh` script just calls `pytest` after making sure that the rest of the stack is running. If you need to pass extra arguments to `pytest`, you can pass them to that command and they will be forwarded.

For example, to stop on first error:

```bash
docker compose exec backend bash scripts/tests-start.sh -x
```

### Test Coverage

When the tests are run, a file `htmlcov/index.html` is generated, you can open it in your browser to see the coverage of the tests.

## Migrations

### Choose One Strategy

Use only one database schema strategy in a project branch:

1. `create_all` strategy (current branch default):
   - Start service, auto-create tables from `./backend/app/models/` with `SQLModel.metadata.create_all(engine)`.
   - Good for early-stage iteration and rapid schema changes.
   - Not ideal for production history tracking.

2. `alembic` strategy:
   - Generate and apply migration files under `./backend/app/alembic/versions/`.
   - Good for production-safe, auditable schema evolution.
   - Requires keeping migration files in sync with model changes.

Current repository also keeps a DB design draft at `./backend/db/schema/design_draft.sql` for reference only.

As during local development your app directory is mounted as a volume inside the container, you can also run the migrations with `alembic` commands inside the container and the migration code will be in your app directory (instead of being only inside the container). So you can add it to your git repository.

Make sure you create a "revision" of your models and that you "upgrade" your database with that revision every time you change them. As this is what will update the tables in your database. Otherwise, your application will have errors.

* Start an interactive session in the backend container:

```console
$ docker compose exec backend bash
```

* Alembic is already configured to import your SQLModel models from `./backend/app/models/`.

* After changing a model (for example, adding a column), inside the container, create a revision, e.g.:

```console
$ alembic revision --autogenerate -m "Add column last_name to User model"
```

* Commit to the git repository the files generated in the alembic directory.

* After creating the revision, run the migration in the database (this is what will actually change the database):

```console
$ alembic upgrade head
```

If you don't want to use migrations at all, uncomment the lines in the file at `./backend/app/core/db.py` that end in:

```python
SQLModel.metadata.create_all(engine)
```

and comment the line in the file `scripts/prestart.sh` that contains:

```console
$ alembic upgrade head
```

If you don't want to start with the default models and want to remove them / modify them, from the beginning, without having any previous revision, you can remove the revision files (`.py` Python files) under `./backend/app/alembic/versions/`. And then create a first migration as described above.

## Email Templates

The email templates are in `./backend/app/email-templates/`. Here, there are two directories: `build` and `src`. The `src` directory contains the source files that are used to build the final email templates. The `build` directory contains the final email templates that are used by the application.

Before continuing, ensure you have the [MJML extension](https://github.com/mjmlio/vscode-mjml) installed in your VS Code.

Once you have the MJML extension installed, you can create a new email template in the `src` directory. After creating the new email template and with the `.mjml` file open in your editor, open the command palette with `Ctrl+Shift+P` and search for `MJML: Export to HTML`. This will convert the `.mjml` file to a `.html` file and now you can save it in the build directory.
