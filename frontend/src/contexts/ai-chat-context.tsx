import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useLocale } from "@/contexts/locale-context"
import { getMessage, readStoredLocale } from "@/i18n/messages"

export type AiChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type PendingInjection = {
  id: number
  text: string
}

type AiChatContextValue = {
  messages: AiChatMessage[]
  sendUserMessage: (text: string) => void
  injectMessage: (text: string) => void
  pending: PendingInjection | null
  clearPending: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

export function AiChatProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  const seqRef = useRef(0)
  const [pending, setPending] = useState<PendingInjection | null>(null)
  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    {
      id: "1",
      role: "assistant",
      content: getMessage(readStoredLocale(), "ai.greeting"),
    },
  ])

  const sendUserMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return
      const userMsg: AiChatMessage = {
        id: `${Date.now()}-u`,
        role: "user",
        content: trimmed,
      }
      const assistantMsg: AiChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: t("ai.unavailable"),
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
    },
    [t],
  )

  const injectMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    seqRef.current += 1
    setPending({ id: seqRef.current, text: trimmed })
  }, [])

  const clearPending = useCallback(() => {
    setPending(null)
  }, [])

  const lastInjectId = useRef(0)
  useEffect(() => {
    if (!pending) return
    if (pending.id <= lastInjectId.current) return
    lastInjectId.current = pending.id
    const text = pending.text
    clearPending()
    sendUserMessage(text)
  }, [pending, clearPending, sendUserMessage])

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
  }, [t])

  const value = useMemo(
    () => ({
      messages,
      sendUserMessage,
      injectMessage,
      pending,
      clearPending,
    }),
    [messages, sendUserMessage, injectMessage, pending, clearPending],
  )

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  )
}

export function useAiChat() {
  const ctx = useContext(AiChatContext)
  if (!ctx) throw new Error("useAiChat must be used within AiChatProvider")
  return ctx
}
