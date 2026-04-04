/**
 * 单篇知识库文档：从后端拉取 Markdown 正文，用 react-markdown 渲染。
 * 与方案中「运行时编译」对应（Vite 侧无 next-mdx-remote，用 markdown 子集即可）。
 */
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import ReactMarkdown from "react-markdown"

import { useLocale } from "@/contexts/locale-context"
import { getKnowledgeDocument } from "@/lib/knowledge-api"

export const Route = createFileRoute("/_layout/knowledge/$spaceId/$docSlug")({
  component: KnowledgeDocPage,
  head: ({ params }) => ({
    meta: [{ title: `Doc — ${params.docSlug}` }],
  }),
})

function KnowledgeDocPage() {
  const { spaceId, docSlug } = Route.useParams()
  const { t } = useLocale()

  const q = useQuery({
    queryKey: ["knowledgeDoc", spaceId, docSlug],
    queryFn: () => getKnowledgeDocument(spaceId, docSlug),
  })

  if (q.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("knowledge.loadingDoc")}
      </p>
    )
  }

  if (q.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">
          {t("knowledge.loadError")}
        </p>
        <p className="mt-2 text-muted-foreground">
          {(q.error as Error)?.message ?? ""}
        </p>
        <Link
          to="/knowledge/$spaceId"
          params={{ spaceId }}
          className="mt-3 inline-block text-[#2563eb] underline-offset-2 hover:underline"
        >
          {t("knowledge.backSpace")}
        </Link>
      </div>
    )
  }

  const doc = q.data
  if (!doc) return null

  return (
    <article className="mx-auto max-w-[800px]">
      <header className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {doc.title}
        </h1>
        {doc.updated_at ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("knowledge.version")}: {doc.content_version} · {doc.updated_at}
          </p>
        ) : null}
      </header>

      {/* 未引入 @tailwindcss/typography，此处用手写类保证可读性 */}
      <div className="markdown-body text-[#374151] dark:text-gray-300 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_p]:mb-4 [&_p]:leading-[1.7] [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3">
        <ReactMarkdown>{doc.markdown}</ReactMarkdown>
      </div>
    </article>
  )
}
