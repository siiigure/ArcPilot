import { Bot, Send, Sparkles, User, X } from "lucide-react"
import { type FormEvent, useState } from "react"

import { useAiChat } from "@/contexts/ai-chat-context"
import { useAppShell } from "@/contexts/app-shell-context"
import { useLocale } from "@/contexts/locale-context"
import { cn } from "@/lib/utils"

type RightSidebarProps = {
  aiSplitLayout?: boolean
}

export const RightSidebar = ({ aiSplitLayout = false }: RightSidebarProps) => {
  const { closeAi } = useAppShell()
  const { messages, sendUserMessage } = useAiChat()
  const { t } = useLocale()
  const [input, setInput] = useState("")

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput("")
    sendUserMessage(text)
  }

  const chatColumn = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-muted/30 p-4">
        <div className="rounded-xl bg-[#82ba00] p-2 text-white shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] leading-tight font-bold tracking-tight">
            {t("ai.name")}
          </h3>
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            {t("ai.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={closeAi}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label={t("ai.closeAria")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-[13px] custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm",
                msg.role === "assistant"
                  ? "bg-[#82ba00] text-white"
                  : "bg-gray-200 dark:bg-white/10",
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl border p-3.5 leading-relaxed shadow-sm transition-all",
                msg.role === "assistant"
                  ? "border-gray-200/50 bg-gray-100/80 text-gray-800 dark:border-white/5 dark:bg-white/5 dark:text-[#e4e6eb]"
                  : "border-[#82ba00]/30 bg-[#82ba00] text-white shadow-[#82ba00]/20",
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-gray-100/50 bg-gray-50/30 p-4 dark:border-white/5 dark:bg-white/5">
        <form onSubmit={handleSend} className="group relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.inputPlaceholder")}
            className="w-full rounded-full border border-gray-200 bg-white py-3 pr-12 pl-4 text-[12px] shadow-inner transition-all focus:ring-2 focus:ring-[#82ba00]/50 focus:outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-[#82ba00] p-2 text-white shadow-sm transition-all hover:bg-[#72a400] active:scale-95 disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
          <Sparkles className="h-2.5 w-2.5 shrink-0 text-[#82ba00]" />
          {t("ai.footerNote")}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shell-panel flex h-full min-h-0 flex-col overflow-hidden">
        {aiSplitLayout ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
            {chatColumn}
            <div className="min-h-0 overflow-y-auto bg-muted/20 p-3 text-xs text-muted-foreground custom-scrollbar">
              {t("ai.artifactsPlaceholder")}
            </div>
          </div>
        ) : (
          chatColumn
        )}
      </div>
    </div>
  )
}
