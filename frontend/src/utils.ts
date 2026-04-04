import { AxiosError } from "axios"

import type { ApiError } from "./client"

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      return "请求超时：后端可能仍在启动（建表/迁移）或数据库未就绪，请稍后重试，并查看后端终端日志。"
    }
    if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
      return "无法连接后端：请确认已启动 API（默认 8000）、且 Vite 代理与 VITE_API_URL 配置正确。"
    }
    return err.message || "网络请求失败。"
  }

  const apiErr = err as ApiError
  const errDetail = (apiErr.body as { detail?: unknown })?.detail
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return (errDetail[0] as { msg?: string }).msg ?? "Something went wrong."
  }
  if (typeof errDetail === "string") return errDetail
  return "Something went wrong."
}

export const handleError = function (
  this: (msg: string) => void,
  err: unknown,
) {
  this(extractErrorMessage(err))
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
