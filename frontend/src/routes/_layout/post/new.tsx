import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { PostsService, TagsService } from "@/client"
import { Checkbox } from "@/components/ui/checkbox"

export const Route = createFileRoute("/_layout/post/new")({
  component: PostNewPage,
  head: () => ({
    meta: [{ title: "Ask - Arcpilot" }],
  }),
})

function PostNewPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: TagsService.listTags,
  })

  const tags = tagsQuery.data?.data ?? []

  const createPostMutation = useMutation({
    mutationFn: () =>
      PostsService.createPost({
        requestBody: {
          title: title.trim(),
          body: body.trim(),
          tag_ids: Array.from(selectedTagIds),
        },
      }),
    onSuccess: (post) => {
      navigate({ to: "/post/$postId", params: { postId: post.id } })
    },
  })

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && body.trim().length > 0
  }, [title, body])

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Ask / Post</h1>
        <p className="text-sm text-muted-foreground">
          先写正文，再考虑 AI；这一步用于验证社区闭环 MVP。
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="用一句话说明你的问题"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
          />
        </div>

        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">正文</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="尽量给出背景、数据、期望结果与你已经尝试过的内容"
            rows={8}
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
          />
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">标签（可选）</label>
            {tagsQuery.isLoading ? (
              <span className="text-xs text-muted-foreground">加载中…</span>
            ) : tagsQuery.isError ? (
              <span className="text-xs text-red-600">加载失败</span>
            ) : null}
          </div>

          {tags.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              暂无标签可选（后端会在初始化时 seed 标签；若你是新库请重启后端容器）。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tags.map((t) => {
                const checked = selectedTagIds.has(t.id)
                return (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/30"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(selectedTagIds)
                        if (v) next.add(t.id)
                        else next.delete(t.id)
                        setSelectedTagIds(next)
                      }}
                    />
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {t.slug}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/30"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canSubmit || createPostMutation.isPending}
            onClick={() => createPostMutation.mutate()}
            className="rounded-md bg-[#82ba00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createPostMutation.isPending ? "发布中…" : "发布"}
          </button>
        </div>

        {createPostMutation.isError ? (
          <div className="mt-3 text-sm text-red-600">
            发布失败，请稍后重试。
          </div>
        ) : null}
      </div>
    </div>
  )
}

