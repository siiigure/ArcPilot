import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

const XL_BREAKPOINT_PX = 1280

type AppShellContextValue = {
  navOpen: boolean
  aiOpen: boolean
  toggleNav: () => void
  toggleAi: () => void
  closeNav: () => void
  closeAi: () => void
  closeOverlays: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const closeNav = useCallback(() => setNavOpen(false), [])
  const closeAi = useCallback(() => setAiOpen(false), [])
  const closeOverlays = useCallback(() => {
    setNavOpen(false)
    setAiOpen(false)
  }, [])

  const toggleNav = useCallback(() => {
    setAiOpen(false)
    setNavOpen((n) => !n)
  }, [])

  const toggleAi = useCallback(() => {
    setNavOpen(false)
    setAiOpen((a) => !a)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${XL_BREAKPOINT_PX}px)`)
    const onChange = () => {
      if (mq.matches) closeOverlays()
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [closeOverlays])

  const value = useMemo(
    () => ({
      navOpen,
      aiOpen,
      toggleNav,
      toggleAi,
      closeNav,
      closeAi,
      closeOverlays,
    }),
    [navOpen, aiOpen, toggleNav, toggleAi, closeNav, closeAi, closeOverlays],
  )

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  )
}

export function useAppShell() {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error("useAppShell must be used within AppShellProvider")
  return ctx
}
