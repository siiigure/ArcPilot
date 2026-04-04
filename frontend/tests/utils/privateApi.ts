// Note: the `PrivateService` is only available when generating the client
// for local environments
import { OpenAPI, PrivateService } from "../../src/client"

/**
 * Playwright 里在 Node 调 API，不经过 Vite 代理，必须直连后端。
 * 勿用 localhost（IPv6/解析问题）；与 vite proxy target 一致。
 */
OpenAPI.BASE =
  process.env.VITE_API_DIRECT_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000"

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return await PrivateService.createUser({
    requestBody: {
      email,
      password,
      is_verified: true,
      full_name: "Test User",
    },
  })
}
