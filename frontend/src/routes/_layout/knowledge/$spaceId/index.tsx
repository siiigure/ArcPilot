/**
 * 某空间知识库首页：无选中文档时的说明与快捷提示。
 */
import { createFileRoute, Link } from "@tanstack/react-router"

import { useLocale } from "@/contexts/locale-context"

export const Route = createFileRoute("/_layout/knowledge/$spaceId/")({
  component: KnowledgeSpaceHome,
})

function KnowledgeSpaceHome() {
  const { spaceId } = Route.useParams()
  const { t } = useLocale()

  return (
    <div className="mx-auto max-w-[800px] text-muted-foreground">
      <p className="mb-4 text-[1.05rem] leading-relaxed text-foreground">
        {t("knowledge.welcomeLine")}
      </p>
      <p className="text-sm">{t("knowledge.pickDoc")}</p>
      <p className="mt-6 text-sm">
        <Link
          to="/spaces/$spaceId"
          params={{ spaceId }}
          className="text-[#2563eb] underline-offset-2 hover:underline"
        >
          {t("knowledge.backToSpace")}
        </Link>
      </p>
    </div>
  )
}
