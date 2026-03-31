import { Bot, Send, Sparkles, User, X } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"

import { useAiChat } from "@/contexts/ai-chat-context"
import { useAppShell } from "@/contexts/app-shell-context"
import { useLocale } from "@/contexts/locale-context"
import { buildAiMockReply, getMessage, readStoredLocale } from "@/i18n/messages"
import { streamMockText } from "@/lib/mock-stream"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export const RightSidebar = () => {
  const { closeAi } = useAppShell()
  const { pending, clearPending } = useAiChat()
  const { locale, t } = useLocale()
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      role: "assistant",
      content: getMessage(readStoredLocale(), "ai.greeting"),
    },
  ])
  const [input, setInput] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const lastInjectId = useRef(0)

  const sendStreamingMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return

      abortRef.current?.abort()

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      }
      const assistantId = (Date.now() + 1).toString()
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])

      const controller = new AbortController()
      abortRef.current = controller

      const reply = buildAiMockReply(locale, content)

      ;(async () => {
        try {
          let acc = ""
          for await (const chunk of streamMockText(reply, {
            signal: controller.signal,
            minDelayMs: 15,
            maxDelayMs: 45,
            minChunk: 1,
            maxChunk: 3,
          })) {
            acc += chunk
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: acc } : m,
              ),
            )
          }
        } catch {
          // 中止不视为错误
        } finally {
          if (abortRef.current === controller) {
            abortRef.current = null
          }
        }
      })()
    },
    [locale],
  )

  useEffect(() => {
    if (!pending) return
    if (pending.id <= lastInjectId.current) return
    lastInjectId.current = pending.id
    const text = pending.text
    clearPending()
    sendStreamingMessage(text)
  }, [pending, clearPending, sendStreamingMessage])

  useEffect(() => {
    setMessages((prev) => {
      const hasUser = prev.some((m) => m.role === "user")
      if (hasUser) return prev
      const first = prev[0]
      if (first?.id === "1" && first.role === "assistant") {
        return [{ ...first, content: t("ai.greeting") }, ...prev.slice(1)]
      }
      return prev
    })
  }, [locale, t])

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput("")
    sendStreamingMessage(text)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="modern-card flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-muted/30 p-4">
          <div className="bg-[#82ba00] rounded-xl p-2 text-white shadow-lg shadow-[#82ba00]/20">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] leading-tight font-bold tracking-tight">
              Arcpilot AI
            </h3>
            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {t("ai.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAi}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground xl:hidden"
            aria-label={t("ai.closeAria")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-[13px] custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                  msg.role === "assistant"
                    ? "bg-[#82ba00] text-white"
                    : "bg-gray-200 dark:bg-white/10"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed shadow-sm transition-all ${
                  msg.role === "assistant"
                    ? "bg-gray-100/80 dark:bg-white/5 text-gray-800 dark:text-[#e4e6eb] rounded-tl-none border border-gray-200/50 dark:border-white/5"
                    : "bg-[#82ba00] text-white rounded-tr-none shadow-[#82ba00]/20"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100/50 dark:border-white/5 bg-gray-50/30 dark:bg-white/5 flex-shrink-0">
          <form onSubmit={handleSend} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.inputPlaceholder")}
              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-4 pr-12 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#82ba00]/50 dark:text-white transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-[#82ba00] text-white rounded-xl hover:bg-[#72a400] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#82ba00]/20"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] font-bold">
            <Sparkles className="h-2.5 w-2.5 text-[#82ba00]" />
            Arcpilot Engine
          </div>
        </div>
      </div>
    </div>
  )
}
