import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type ComposerMode = "ask" | "answer" | "post"

type CreateComposerState = {
  open: boolean
  mode: ComposerMode
}

type CreateComposerContextValue = {
  state: CreateComposerState
  openComposer: (mode: ComposerMode) => void
  closeComposer: () => void
  setMode: (mode: ComposerMode) => void
}

const CreateComposerContext = createContext<CreateComposerContextValue | null>(null)

export function CreateComposerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<CreateComposerState>({
    open: false,
    mode: "ask",
  })

  const openComposer = useCallback((mode: ComposerMode) => {
    // Radix Dialog：若在同一轮 pointer/click 里立刻 open=true，遮罩可能把这次点击当成「点外部」而立刻关闭。
    // 推迟到下一宏任务，等当前点击事件完全结束后再打开，弹窗才能稳定显示。
    window.setTimeout(() => {
      setState({ open: true, mode })
    }, 0)
  }, [])

  const closeComposer = useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])

  const setMode = useCallback((mode: ComposerMode) => {
    setState((s) => ({ ...s, mode }))
  }, [])

  const value = useMemo<CreateComposerContextValue>(
    () => ({ state, openComposer, closeComposer, setMode }),
    [state, openComposer, closeComposer, setMode]
  )

  return (
    <CreateComposerContext.Provider value={value}>
      {children}
    </CreateComposerContext.Provider>
  )
}

export function useCreateComposer() {
  const ctx = useContext(CreateComposerContext)
  if (!ctx) {
    throw new Error("useCreateComposer 必须在 CreateComposerProvider 内使用")
  }
  return ctx
}

