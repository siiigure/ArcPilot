import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Expand, Minimize2, Send, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { ApiError, PostsService, TagsService } from "@/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreateComposer } from "@/contexts/create-composer-context"
import { useLocale } from "@/contexts/locale-context"
import { cn } from "@/lib/utils"

/**
 * 创建内容弹窗（提问 / 回答 / 发帖）
 *
 * 交互目标（参考你给的截图）：
 * - 默认是一个居中的卡片弹窗
 * - 可以一键放大全屏，再一键还原
 * - 顶部有「提问 / 回答 / 发帖」三段切换
 *
 * MVP 范围：
 * - 「提问」「发帖」：写入后端 Post（POST /api/v1/posts/）
 * - 「回答」：对选定问题写 Reply（POST /api/v1/posts/{id}/replies）
 */
export function CreateComposerDialog() {
  const { state, closeComposer, setMode } = useCreateComposer()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [fullscreen, setFullscreen] = useState(false)

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [answerQuestionId, setAnswerQuestionId] = useState("")
  const [answerBody, setAnswerBody] = useState("")

  const tagsQuery = useQuery({
    queryKey: ["tags", "all"],
    queryFn: () => TagsService.listTags({}),
    enabled: state.open && (state.mode === "ask" || state.mode === "post"),
  })

  const tags = tagsQuery.data?.data ?? []

  const answerQuestionsQuery = useQuery({
    queryKey: ["composerAnswerQuestions"],
    queryFn: () => PostsService.listPosts({ skip: 0, limit: 50 }),
    enabled: state.open && state.mode === "answer",
  })

  const answerQuestions = answerQuestionsQuery.data ?? []

  const canSubmitPost = useMemo(() => {
    return title.trim().length > 0 && body.trim().length > 0
  }, [title, body])

  const canSubmitAnswer = useMemo(
    () => answerQuestionId.length > 0 && answerBody.trim().length > 0,
    [answerQuestionId, answerBody],
  )

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return await PostsService.createPost({
        requestBody: {
          title: title.trim(),
          body: body.trim(),
          tag_ids: Array.from(selectedTagIds),
        },
      })
    },
    onSuccess: (post) => {
      setTitle("")
      setBody("")
      setSelectedTagIds(new Set())
      closeComposer()
      void navigate({ to: "/post/$postId", params: { postId: post.id } })
    },
  })

  const createReplyMutation = useMutation({
    mutationFn: async () => {
      if (!answerQuestionId) throw new Error("请先选择问题")
      return await PostsService.createReply({
        postId: answerQuestionId,
        requestBody: {
          body: answerBody.trim(),
        },
      })
    },
    onSuccess: () => {
      const postId = answerQuestionId
      setAnswerBody("")
      closeComposer()
      if (postId) {
        void navigate({ to: "/post/$postId", params: { postId } })
      }
    },
  })

  const dialogClassName = cn(
    "!flex min-h-0 flex-col gap-0 overflow-hidden p-0",
    fullscreen
      ? "h-screen max-h-screen w-screen max-w-none translate-x-[-50%] translate-y-[-50%] rounded-none"
      : "max-h-[min(92dvh,52rem)] w-[calc(100vw-1rem)] sm:max-w-3xl",
  )

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!open) {
          closeComposer()
          setFullscreen(false)
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={dialogClassName}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Create content</DialogTitle>
        <Tabs
          value={state.mode}
          onValueChange={(v) => setMode(v as any)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
              <TabsList className="inline-flex h-9 w-max min-w-0 max-w-none shrink-0">
                <TabsTrigger value="ask">Ask</TabsTrigger>
                <TabsTrigger value="answer">Answer</TabsTrigger>
                <TabsTrigger value="post">Post</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setFullscreen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                aria-label={fullscreen ? "退出全屏" : "全屏"}
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Expand className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeComposer()
                  setFullscreen(false)
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className={cn(
              "bg-background px-3 py-3 sm:px-4 sm:py-4",
              "min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
              "touch-pan-y custom-scrollbar [scrollbar-gutter:stable]",
              fullscreen && "flex flex-1 flex-col",
            )}
          >
            <TabsContent value="ask">
              <ComposerPostForm
                modeLabel="Ask"
                composerOpen={state.open}
                title={title}
                body={body}
                setTitle={setTitle}
                setBody={setBody}
                tagsQueryState={{
                  isLoading: tagsQuery.isLoading,
                  isError: tagsQuery.isError,
                  tags,
                  selectedTagIds,
                  setSelectedTagIds,
                }}
                queryClient={queryClient}
                canSubmit={canSubmitPost}
                isSubmitting={createPostMutation.isPending}
                submitLabel="发布问题"
                onSubmit={() => createPostMutation.mutate()}
                error={
                  createPostMutation.isError ? "发布失败，请稍后重试。" : null
                }
              />
            </TabsContent>

            <TabsContent value="post">
              <ComposerPostForm
                modeLabel="发帖"
                composerOpen={state.open}
                title={title}
                body={body}
                setTitle={setTitle}
                setBody={setBody}
                tagsQueryState={{
                  isLoading: tagsQuery.isLoading,
                  isError: tagsQuery.isError,
                  tags,
                  selectedTagIds,
                  setSelectedTagIds,
                }}
                queryClient={queryClient}
                canSubmit={canSubmitPost}
                isSubmitting={createPostMutation.isPending}
                submitLabel="发布"
                onSubmit={() => createPostMutation.mutate()}
                error={
                  createPostMutation.isError ? "发布失败，请稍后重试。" : null
                }
              />
            </TabsContent>

            <TabsContent value="answer">
              <ComposerAnswerForm
                questions={answerQuestions.map((q) => ({
                  id: q.id,
                  title: q.title,
                  authorName: q.author.name,
                }))}
                selectedQuestionId={answerQuestionId}
                setSelectedQuestionId={setAnswerQuestionId}
                answer={answerBody}
                setAnswer={setAnswerBody}
                canSubmit={canSubmitAnswer}
                isSubmitting={createReplyMutation.isPending}
                isLoadingQuestions={answerQuestionsQuery.isLoading}
                hasQuestionLoadError={answerQuestionsQuery.isError}
                onSubmit={() => createReplyMutation.mutate()}
                error={
                  createReplyMutation.isError
                    ? "回答发布失败，请稍后重试。"
                    : null
                }
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ComposerPostForm({
  modeLabel,
  composerOpen,
  title,
  body,
  setTitle,
  setBody,
  tagsQueryState,
  queryClient,
  canSubmit,
  isSubmitting,
  submitLabel,
  onSubmit,
  error,
}: {
  modeLabel: string
  composerOpen: boolean
  title: string
  body: string
  setTitle: (v: string) => void
  setBody: (v: string) => void
  tagsQueryState: {
    isLoading: boolean
    isError: boolean
    tags: Array<{ id: string; name: string; slug: string }>
    selectedTagIds: Set<string>
    setSelectedTagIds: (
      next: Set<string> | ((prev: Set<string>) => Set<string>),
    ) => void
  }
  queryClient: ReturnType<typeof useQueryClient>
  canSubmit: boolean
  isSubmitting: boolean
  submitLabel: string
  onSubmit: () => void
  error: string | null
}) {
  const { t } = useLocale()
  const { isLoading, isError, tags, selectedTagIds, setSelectedTagIds } =
    tagsQueryState

  const [newTopicName, setNewTopicName] = useState("")
  const [newTopicDesc, setNewTopicDesc] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(newTopicName.trim()), 350)
    return () => clearTimeout(id)
  }, [newTopicName])

  useEffect(() => {
    if (!composerOpen) {
      setNewTopicName("")
      setNewTopicDesc("")
      setDebouncedQ("")
    }
  }, [composerOpen])

  const suggestQuery = useQuery({
    queryKey: ["tagSuggest", debouncedQ],
    queryFn: () => TagsService.suggestTags({ q: debouncedQ, limit: 10 }),
    enabled: debouncedQ.length >= 1,
  })

  const createTagMutation = useMutation({
    mutationFn: () =>
      TagsService.createTag({
        requestBody: {
          name: newTopicName.trim(),
          description: newTopicDesc.trim() || undefined,
        },
      }),
    onSuccess: (tag) => {
      setSelectedTagIds((prev) => new Set([...prev, tag.id]))
      setNewTopicName("")
      setNewTopicDesc("")
      void queryClient.invalidateQueries({ queryKey: ["tags"] })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 429) {
        toast.error(t("composer.topicLimit"))
        return
      }
      if (err instanceof ApiError) {
        const detail = (err.body as { detail?: unknown } | undefined)?.detail
        toast.error(
          typeof detail === "string" ? detail : t("composer.topicLimit"),
        )
      }
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-semibold">{modeLabel}</div>
        <div className="text-xs text-muted-foreground">
          默认以卡片弹窗形式创建内容，你也可以右上角切换全屏。
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">标题</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="一句话说明要点"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">正文</div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="补充背景、上下文、你已尝试的方案等"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">标签（可选）</div>
          {isLoading ? (
            <span className="text-xs text-muted-foreground">加载中…</span>
          ) : isError ? (
            <span className="text-xs text-red-600">加载失败</span>
          ) : null}
        </div>

        {tags.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            暂无标签可选。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tags.map((tg) => {
              const checked = selectedTagIds.has(tg.id)
              return (
                <label
                  key={tg.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/30"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => {
                      const next = new Set(selectedTagIds)
                      if (v) next.add(tg.id)
                      else next.delete(tg.id)
                      setSelectedTagIds(next)
                    }}
                  />
                  <span className="font-medium">{tg.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {tg.slug}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-[#82ba00]/25 bg-[#82ba00]/5 p-3 dark:bg-[#82ba00]/10">
        <div className="text-sm font-medium">{t("composer.newTopic")}</div>
        <p className="text-xs text-muted-foreground">
          {t("sidebar.addTopicHint")}
        </p>
        <input
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          placeholder={t("composer.newTopicName")}
          maxLength={50}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        />
        <textarea
          value={newTopicDesc}
          onChange={(e) => setNewTopicDesc(e.target.value)}
          placeholder={t("composer.newTopicDesc")}
          rows={2}
          maxLength={500}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        />
        {debouncedQ.length >= 1 &&
        (suggestQuery.data?.data?.length ?? 0) > 0 ? (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              {t("composer.similarTopics")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(suggestQuery.data?.data ?? []).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedTagIds((prev) => new Set([...prev, s.id]))
                  }}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          disabled={
            newTopicName.trim().length < 1 || createTagMutation.isPending
          }
          onClick={() => createTagMutation.mutate()}
          className="rounded-md bg-[#82ba00] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#72a400] disabled:opacity-50"
        >
          {createTagMutation.isPending ? "…" : t("composer.createTopic")}
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-[#82ba00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "发布中…" : submitLabel}
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  )
}

function ComposerAnswerForm({
  questions,
  selectedQuestionId,
  setSelectedQuestionId,
  answer,
  setAnswer,
  canSubmit,
  isSubmitting,
  isLoadingQuestions,
  hasQuestionLoadError,
  onSubmit,
  error,
}: {
  questions: Array<{ id: string; title: string; authorName: string }>
  selectedQuestionId: string
  setSelectedQuestionId: (v: string) => void
  answer: string
  setAnswer: (v: string) => void
  canSubmit: boolean
  isSubmitting: boolean
  isLoadingQuestions: boolean
  hasQuestionLoadError: boolean
  onSubmit: () => void
  error: string | null
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-semibold">回答</div>
        <div className="text-xs text-muted-foreground">
          先选一个问题，再发布回答（回答会写入该问题的回复列表）。
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">选择问题</div>
          {isLoadingQuestions ? (
            <span className="text-xs text-muted-foreground">加载中…</span>
          ) : hasQuestionLoadError ? (
            <span className="text-xs text-red-600">加载失败</span>
          ) : null}
        </div>
        <select
          value={selectedQuestionId}
          onChange={(e) => setSelectedQuestionId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        >
          <option value="">请选择你要回答的问题</option>
          {questions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} · {q.authorName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">内容</div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={10}
          placeholder="写下你的回答，尽量给出可执行步骤与原因"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#82ba00]/40"
        />
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-[#82ba00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#72a400] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "发布中…" : "发布回答"}
        </button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  )
}
