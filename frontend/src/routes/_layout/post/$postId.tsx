import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft, Sparkles, User } from "lucide-react"
import { useMemo, useState } from "react"

import { PostsService } from "@/client"
import { useAiChat } from "@/contexts/ai-chat-context"
import { useLocale } from "@/contexts/locale-context"
import type { Locale } from "@/i18n/messages"

export const Route = createFileRoute("/_layout/post/$postId")({
  component: PostDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `帖子 - ${params.postId}` }],
  }),
})

function BackToHomeLink() {
  const { t } = useLocale()
  return (
    <Link
      to="/"
      className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {t("post.backHome")}
    </Link>
  )
}

function formatPostForAi(locale: Locale, title: string, content: string) {
  if (locale === "zh") {
    return `【当前帖子】\n标题：${title}\n\n正文：\n${content}`
  }
  return `[Current post]\nTitle: ${title}\n\nBody:\n${content}`
}

function PostDetailPage() {
  const { postId } = Route.useParams()
  const { injectMessage } = useAiChat()
  const { locale, t } = useLocale()
  const [replyBody, setReplyBody] = useState("")

  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => PostsService.getPostDetail({ postId }),
  })

  const repliesQuery = useQuery({
    queryKey: ["postReplies", postId],
    queryFn: () => PostsService.listReplies({ postId }),
  })

  const createReplyMutation = useMutation({
    mutationFn: () =>
      PostsService.createReply({
        postId,
        requestBody: { body: replyBody.trim() },
      }),
    onSuccess: async () => {
      setReplyBody("")
      await repliesQuery.refetch()
    },
  })

  const canReply = useMemo(() => replyBody.trim().length > 0, [replyBody])

  if (postQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <BackToHomeLink />
        <div className="py-8 text-sm text-muted-foreground">加载中…</div>
      </div>
    )
  }
  if (postQuery.isError || !postQuery.data) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <BackToHomeLink />
        <div className="py-8 text-sm text-red-600">加载失败。</div>
      </div>
    )
  }

  const post = postQuery.data

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <BackToHomeLink />
      <article className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-3 text-sm">
          {post.author.id ? (
            <Link
              to="/u/$userId"
              params={{ userId: post.author.id }}
              className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-[#82ba00]"
            >
              <User
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {post.author.name}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 font-medium">
              <User
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              {post.author.name}
            </span>
          )}
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">{post.timestamp}</div>
          <button
            type="button"
            onClick={() =>
              injectMessage(formatPostForAi(locale, post.title, post.content))
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-[#82ba00]/40 bg-[#82ba00]/10 px-3 py-1.5 text-xs font-medium text-[#5a8000] transition-colors hover:bg-[#82ba00]/20 dark:text-[#a3d94d]"
            aria-label={t("post.sendToAiAria")}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("post.sendToAi")}
          </button>
        </div>
        <h1 className="mb-3 text-xl font-bold leading-tight">{post.title}</h1>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {post.content}
        </div>
      </article>

      <section className="mt-6 rounded-lg border border-border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">回复</h2>

        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">写下你的回复</label>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={4}
            placeholder="补充你的思路、代码片段或更多信息"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={!canReply || createReplyMutation.isPending}
              onClick={() => createReplyMutation.mutate()}
              className="rounded-md bg-[#82ba00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createReplyMutation.isPending ? "发布中…" : "发布回复"}
            </button>
          </div>
          {createReplyMutation.isError ? (
            <div className="text-sm text-red-600">回复失败，请稍后重试。</div>
          ) : null}
        </div>

        {repliesQuery.isLoading ? (
          <div className="py-4 text-sm text-muted-foreground">加载回复中…</div>
        ) : repliesQuery.isError ? (
          <div className="py-4 text-sm text-red-600">回复加载失败。</div>
        ) : (repliesQuery.data?.length ?? 0) === 0 ? (
          <div className="py-4 text-sm text-muted-foreground">
            还没有回复，来抢沙发吧。
          </div>
        ) : (
          <ul className="space-y-3">
            {repliesQuery.data!.map((r) => (
              <li key={r.id} className="rounded-md border border-border p-3">
                <div className="mb-1 text-xs text-muted-foreground">
                  {r.author.name} · {r.timestamp}
                </div>
                <div className="whitespace-pre-wrap text-sm">{r.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
