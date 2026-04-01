/**
 * 协作空间 REST 调用（后端尚未纳入 openapi-ts 生成客户端时，在此手写）。
 * 与 {@link OpenAPI} 共用 BASE 与 TOKEN（见 main.tsx）。
 */

import axios from "axios"

import { OpenAPI } from "@/client"
import type { ApiRequestOptions } from "@/client/core/ApiRequestOptions"

const http = axios.create({
  // 避免后端不可达时前端一直 pending
  timeout: 10000,
})

async function authHeaders(): Promise<Record<string, string>> {
  const resolver = OpenAPI.TOKEN
  const empty = {} as ApiRequestOptions<string>
  const token =
    typeof resolver === "function"
      ? String(await resolver(empty))
      : (resolver ?? "")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function apiRoot(): string {
  const base = OpenAPI.BASE.replace(/\/$/, "")
  return `${base}/api/v1`
}

/** 将相对 upload_url 转为可 fetch 的绝对地址 */
export function resolveUploadUrl(uploadUrl: string): string {
  if (uploadUrl.startsWith("http://") || uploadUrl.startsWith("https://")) {
    return uploadUrl
  }
  const base = OpenAPI.BASE.replace(/\/$/, "")
  return `${base}${uploadUrl.startsWith("/") ? "" : "/"}${uploadUrl}`
}

// --------------------------------------------------------------------------- 类型（与后端 Pydantic 模型对齐）

export interface SpacePublic {
  id: string
  name: string
  description: string | null
  owner_id: string
  storage_quota: number
  used_storage: number
  current_user_role: string
  created_at: string | null
  updated_at: string | null
}

export interface SpacesPublic {
  data: SpacePublic[]
  count: number
}

export interface SpaceCreateBody {
  name: string
  description?: string | null
  storage_quota?: number | null
}

export interface SpaceMemberPublic {
  user_id: string
  email: string
  full_name: string | null
  role: string
  joined_at: string | null
}

export interface SpaceMembersPublic {
  data: SpaceMemberPublic[]
  count: number
}

export interface SpaceMemberRoleUpdateBody {
  role: "editor" | "viewer"
}

export interface SpaceInviteCreateBody {
  role: "editor" | "viewer"
  email?: string | null
  expires_in_days?: number
}

export interface SpaceInvitePublic {
  invite_code: string
  role: string
  status: string
  expires_at: string | null
}

export interface AcceptInviteBody {
  invite_code: string
}

export interface AcceptInviteResponse {
  message: string
  space_id: string
  role: string
}

export interface AssetPresignBody {
  logical_name: string
  mime_type: string
  size: number
}

export interface AssetPresignResponse {
  upload_url: string
  upload_method: string
  upload_token: string
  asset_meta: {
    logical_name: string
    version: number
    storage_key: string
    size: number
  }
}

export interface AssetCompleteBody {
  upload_token: string
  type?: string | null
}

export interface AssetPublic {
  id: number
  logical_name: string
  version: number
  type: string
  size: number
  storage_key: string
  uploader_id: string
  created_at: string | null
}

export interface AssetsPublic {
  data: AssetPublic[]
  count: number
}

// --------------------------------------------------------------------------- API

export async function listSpaces(): Promise<SpacesPublic> {
  const r = await http.get<SpacesPublic>(`${apiRoot()}/spaces/`, {
    headers: await authHeaders(),
  })
  return r.data
}

export async function createSpace(body: SpaceCreateBody): Promise<SpacePublic> {
  const r = await http.post<SpacePublic>(`${apiRoot()}/spaces/`, body, {
    headers: await authHeaders(),
  })
  return r.data
}

export async function getSpace(spaceId: string): Promise<SpacePublic> {
  const r = await http.get<SpacePublic>(`${apiRoot()}/spaces/${spaceId}`, {
    headers: await authHeaders(),
  })
  return r.data
}

export async function listSpaceMembers(
  spaceId: string,
): Promise<SpaceMembersPublic> {
  const r = await http.get<SpaceMembersPublic>(
    `${apiRoot()}/spaces/${spaceId}/members`,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function createSpaceInvite(
  spaceId: string,
  body: SpaceInviteCreateBody,
): Promise<SpaceInvitePublic> {
  const r = await http.post<SpaceInvitePublic>(
    `${apiRoot()}/spaces/${spaceId}/invite`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function updateSpaceMemberRole(
  spaceId: string,
  memberUserId: string,
  body: SpaceMemberRoleUpdateBody,
): Promise<{ message: string }> {
  const r = await http.patch<{ message: string }>(
    `${apiRoot()}/spaces/${spaceId}/members/${memberUserId}`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function removeSpaceMember(
  spaceId: string,
  memberUserId: string,
): Promise<{ message: string }> {
  const r = await http.delete<{ message: string }>(
    `${apiRoot()}/spaces/${spaceId}/members/${memberUserId}`,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function acceptInvite(
  body: AcceptInviteBody,
): Promise<AcceptInviteResponse> {
  const r = await http.post<AcceptInviteResponse>(
    `${apiRoot()}/invites/accept`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function presignAssetUpload(
  spaceId: string,
  body: AssetPresignBody,
): Promise<AssetPresignResponse> {
  const r = await http.post<AssetPresignResponse>(
    `${apiRoot()}/spaces/${spaceId}/assets/presign`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function completeAssetUpload(
  spaceId: string,
  body: AssetCompleteBody,
): Promise<AssetPublic> {
  const r = await http.post<AssetPublic>(
    `${apiRoot()}/spaces/${spaceId}/assets/complete`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function listSpaceAssets(
  spaceId: string,
  allVersions = false,
): Promise<AssetsPublic> {
  const r = await http.get<AssetsPublic>(
    `${apiRoot()}/spaces/${spaceId}/assets`,
    {
      headers: await authHeaders(),
      params: { all_versions: allVersions },
    },
  )
  return r.data
}

export async function deleteSpaceAsset(
  spaceId: string,
  assetId: number,
): Promise<{ message: string }> {
  const r = await http.delete<{ message: string }>(
    `${apiRoot()}/spaces/${spaceId}/assets/${assetId}`,
    { headers: await authHeaders() },
  )
  return r.data
}

/** 带鉴权下载资源（浏览器无法直接对受保护 GET 使用 <a href>） */
export async function downloadSpaceAsset(
  spaceId: string,
  assetId: number,
  filename: string,
): Promise<void> {
  const r = await http.get(`${apiRoot()}/spaces/${spaceId}/assets/${assetId}`, {
    headers: await authHeaders(),
    responseType: "blob",
  })
  const url = URL.createObjectURL(r.data as Blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}
