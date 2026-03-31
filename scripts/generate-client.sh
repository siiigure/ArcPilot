#! /usr/bin/env bash

set -e
set -x

cd backend
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../openapi.json
cd ..
mv openapi.json frontend/

# 生成前端 OpenAPI client（优先 bun；若环境未安装 bun，则自动回退到 npm）
if command -v bun >/dev/null 2>&1; then
  bun run --filter frontend generate-client
  bun run lint
else
  echo "bun 未安装，回退使用 npm 生成前端 client"
  (cd frontend && npm run generate-client)
  # lint 不是生成 client 的必要步骤；若你希望保持一致，也可以在这里补上 npm lint
fi
