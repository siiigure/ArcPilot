import { Bot, Send, Sparkles, User, X } from "lucide-react"
import { type FormEvent, useRef, useState } from "react"

import { useAppShell } from "@/contexts/app-shell-context"
import { streamMockText } from "@/lib/mock-stream"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export const RightSidebar = () => {
  const { closeAi } = useAppShell()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm Arcpilot AI. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // 如果有正在进行的流，先中止
    abortRef.current?.abort()

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput("")

    const controller = new AbortController()
    abortRef.current = controller

    const reply =
      `这是一个模拟的流式输出示例，用于演示 ArcPilot 的打字机效果。\n\n` +
      `你的问题是：「${input}」。下面是一些思路：\n` +
      `1. 明确 GIS 任务目标与数据范围；\n` +
      `2. 选用合适的数据结构与空间分析工具；\n` +
      `3. 逐步验证结果并可视化输出。`

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
              Intelligent Assistant
            </p>
          </div>
          <button
            type="button"
            onClick={closeAi}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground xl:hidden"
            aria-label="关闭 AI 助手"
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
              placeholder="Type your message..."
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
