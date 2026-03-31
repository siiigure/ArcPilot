import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

type PendingInjection = {
  id: number
  text: string
}

type AiChatContextValue = {
  /** 将文本作为用户消息推入右侧 AI 对话并触发回复 */
  injectMessage: (text: string) => void
  pending: PendingInjection | null
  clearPending: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

export function AiChatProvider({ children }: { children: ReactNode }) {
  const seqRef = useRef(0)
  const [pending, setPending] = useState<PendingInjection | null>(null)

  const injectMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    seqRef.current += 1
    setPending({ id: seqRef.current, text: trimmed })
  }, [])

  const clearPending = useCallback(() => {
    setPending(null)
  }, [])

  const value = useMemo(
    () => ({ injectMessage, pending, clearPending }),
    [injectMessage, pending, clearPending],
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
