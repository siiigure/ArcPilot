import { LayoutGrid, MessageSquare, Plus, User } from "lucide-react"

import { useCreateComposer } from "@/contexts/create-composer-context"
import { useLocale } from "@/contexts/locale-context"

export const QuickPostBox = () => {
  const { openComposer } = useCreateComposer()
  const { t } = useLocale()

  return (
    <div
      className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center gap-3">
        <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          <User className="h-full w-full p-2 text-gray-400" />
        </div>
        <input
          type="text"
          readOnly
          placeholder={t("quickPost.placeholder")}
          onClick={() => openComposer("ask")}
          className="flex-grow cursor-pointer rounded-full border border-gray-200 bg-[#F1F2F2] px-4 py-2 text-sm transition-colors hover:bg-gray-200 focus:outline-none"
        />
      </div>
      <div className="flex justify-around border-t border-gray-50 pt-2 text-sm text-gray-500">
        <button
          type="button"
          onClick={() => openComposer("ask")}
          className="flex items-center gap-2 rounded-md px-4 py-2 transition-colors hover:bg-gray-100"
        >
          <MessageSquare className="h-4 w-4" /> {t("quickPost.ask")}
        </button>
        <button
          type="button"
          onClick={() => openComposer("answer")}
          className="flex items-center gap-2 rounded-md px-4 py-2 transition-colors hover:bg-gray-100"
        >
          <LayoutGrid className="h-4 w-4" /> {t("quickPost.answer")}
        </button>
        <button
          type="button"
          onClick={() => openComposer("post")}
          className="flex items-center gap-2 rounded-md px-4 py-2 transition-colors hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" /> {t("quickPost.post")}
        </button>
      </div>
    </div>
  )
}
