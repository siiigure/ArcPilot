/**
 * 知识库 REST 客户端（与 backend/app/api/routes/knowledge.py 对齐）。
 *
 * 基址与鉴权与 {@link OpenAPI} / spaces-api 一致：Bearer token。
 * 路由形态：`/api/v1/spaces/{spaceUuid}/knowledge/...`
 */

import axios from "axios"

import { OpenAPI } from "@/client"
import type { ApiRequestOptions } from "@/client/core/ApiRequestOptions"

const http = axios.create({ timeout: 15000 })

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

// --------------------------------------------------------------------------- 类型（与后端 Pydantic 模型一致）

export interface WikiCategoryPublic {
  id: number
  parent_id: number | null
  slug: string
  title: string
  sort_order: number
}

export interface WikiDocumentPublic {
  id: number
  category_id: number | null
  slug: string
  title: string
  content_version: number
  updated_at: string | null
}

export interface WikiTreeResponse {
  categories: WikiCategoryPublic[]
  documents: WikiDocumentPublic[]
}

export interface WikiDocumentDetailResponse {
  slug: string
  title: string
  markdown: string
  content_version: number
  updated_at: string | null
}

export interface WikiSearchHit {
  slug: string
  title: string
  excerpt: string | null
}

export interface WikiSearchResponse {
  hits: WikiSearchHit[]
}

export interface WikiDocCreateBody {
  title: string
  slug: string
  markdown: string
  category_id?: number | null
}

export interface WikiCategoryCreateBody {
  title: string
  slug: string
  parent_id?: number | null
}

// --------------------------------------------------------------------------- API

export async function getKnowledgeTree(
  spaceId: string,
): Promise<WikiTreeResponse> {
  const r = await http.get<WikiTreeResponse>(
    `${apiRoot()}/spaces/${spaceId}/knowledge/tree`,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function getKnowledgeDocument(
  spaceId: string,
  slug: string,
): Promise<WikiDocumentDetailResponse> {
  const enc = encodeURIComponent(slug)
  const r = await http.get<WikiDocumentDetailResponse>(
    `${apiRoot()}/spaces/${spaceId}/knowledge/docs/${enc}`,
    { headers: await authHeaders() },
  )
  return r.data
}

export async function searchKnowledge(
  spaceId: string,
  q: string,
): Promise<WikiSearchResponse> {
  const r = await http.get<WikiSearchResponse>(
    `${apiRoot()}/spaces/${spaceId}/knowledge/search`,
    {
      headers: await authHeaders(),
      params: { q },
    },
  )
  return r.data
}

/** owner/editor：新建文档 */
export async function createKnowledgeDocument(
  spaceId: string,
  body: WikiDocCreateBody,
): Promise<WikiDocumentPublic> {
  const r = await http.post<WikiDocumentPublic>(
    `${apiRoot()}/spaces/${spaceId}/knowledge/docs`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}

/** owner/editor：新建分类（可选） */
export async function createKnowledgeCategory(
  spaceId: string,
  body: WikiCategoryCreateBody,
): Promise<WikiCategoryPublic> {
  const r = await http.post<WikiCategoryPublic>(
    `${apiRoot()}/spaces/${spaceId}/knowledge/categories`,
    body,
    { headers: await authHeaders() },
  )
  return r.data
}
