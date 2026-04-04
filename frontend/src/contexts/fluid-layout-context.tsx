import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  type GroupImperativeHandle,
  type Layout,
  type PanelSize,
  useGroupRef,
} from "react-resizable-panels"

export type FluidPreset = "forum" | "balanced" | "ai" | "custom"

export const FLUID_PANEL_FORUM = "forum"
export const FLUID_PANEL_AI = "ai"
export const FLUID_STORAGE_KEY = "arcpilot-fluid-workspace-v1"

const COMPACT_ENTER_PX = 280
const COMPACT_EXIT_PX = 320

/** AI 列在 Group 内占比下限（%），与拖拽 minSize 一致 */
export const FLUID_AI_MIN_PERCENT = 30

export type FluidLayoutContextValue = {
  groupRef: RefObject<GroupImperativeHandle | null>
  preset: FluidPreset
  /** 用户折叠左侧导航为图标栏（与分栏预设独立） */
  navRailCompact: boolean
  toggleNavRail: () => void
  applyPreset: (p: "forum" | "balanced" | "ai") => void
  forumViewCompact: boolean
  aiPanelPercent: number
  aiSplitLayout: boolean
  onLayoutChanged: (layout: Layout) => void
  onForumPanelResize: (
    size: PanelSize,
    id: string | number | undefined,
    prev: PanelSize | undefined,
  ) => void
  toggleBalancedVsCustom: () => void
}

const FluidLayoutContext = createContext<FluidLayoutContextValue | null>(null)

export function FluidLayoutProvider({ children }: { children: ReactNode }) {
  const groupRef = useGroupRef()
  const [preset, setPreset] = useState<FluidPreset>("balanced")
  const [navRailCompact, setNavRailCompact] = useState(false)
  const [forumViewCompact, setForumViewCompact] = useState(false)
  const [aiPanelPercent, setAiPanelPercent] = useState(50)

  const intentRef = useRef<FluidPreset | null>(null)
  const lastCustomRef = useRef<Layout | null>(null)
  const navRailCompactRef = useRef(false)
  const restoringRef = useRef(false)
  const presetRef = useRef<FluidPreset>(preset)
  useEffect(() => {
    presetRef.current = preset
  }, [preset])

  const syncNavRailCompact = useCallback((v: boolean) => {
    navRailCompactRef.current = v
    setNavRailCompact(v)
  }, [])

  const persist = useCallback((layout: Layout, nextPreset: FluidPreset) => {
    try {
      localStorage.setItem(
        FLUID_STORAGE_KEY,
        JSON.stringify({
          layout,
          navRailCompact: navRailCompactRef.current,
          preset: nextPreset,
          lastCustom: lastCustomRef.current,
        }),
      )
    } catch {
      // ignore
    }
  }, [])

  const persistNavRailOnly = useCallback(() => {
    try {
      const layout = groupRef.current?.getLayout()
      const raw = localStorage.getItem(FLUID_STORAGE_KEY)
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
      const payload = {
        ...prev,
        navRailCompact: navRailCompactRef.current,
        ...(layout && Object.keys(layout).length > 0 ? { layout } : {}),
        preset: presetRef.current,
        lastCustom: lastCustomRef.current,
      }
      localStorage.setItem(FLUID_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }, [groupRef])

  const toggleNavRail = useCallback(() => {
    syncNavRailCompact(!navRailCompactRef.current)
    queueMicrotask(() => persistNavRailOnly())
  }, [syncNavRailCompact, persistNavRailOnly])

  const applyPreset = useCallback(
    (p: "forum" | "balanced" | "ai") => {
      intentRef.current = p
      setPreset(p)
      const next =
        p === "forum"
          ? {
              [FLUID_PANEL_FORUM]: 100 - FLUID_AI_MIN_PERCENT,
              [FLUID_PANEL_AI]: FLUID_AI_MIN_PERCENT,
            }
          : p === "balanced"
            ? { [FLUID_PANEL_FORUM]: 50, [FLUID_PANEL_AI]: 50 }
            : { [FLUID_PANEL_FORUM]: 20, [FLUID_PANEL_AI]: 80 }
      queueMicrotask(() => {
        groupRef.current?.setLayout(next)
      })
    },
    [groupRef],
  )

  const onLayoutChanged = useCallback(
    (layout: Layout) => {
      const ai = layout[FLUID_PANEL_AI]
      if (typeof ai === "number") setAiPanelPercent(ai)

      if (restoringRef.current) {
        restoringRef.current = false
        persist(layout, presetRef.current)
        return
      }

      let nextPreset: FluidPreset
      if (intentRef.current) {
        nextPreset = intentRef.current
        intentRef.current = null
      } else {
        nextPreset = "custom"
      }

      setPreset(nextPreset)
      persist(layout, nextPreset)
    },
    [persist],
  )

  const toggleBalancedVsCustom = useCallback(() => {
    const current = groupRef.current?.getLayout()
    if (!current) return
    const forum = current[FLUID_PANEL_FORUM] ?? 50
    const isBalanced = Math.abs(forum - 50) < 5
    if (isBalanced) {
      if (lastCustomRef.current) {
        groupRef.current?.setLayout(lastCustomRef.current)
      }
    } else {
      lastCustomRef.current = { ...current }
      intentRef.current = "balanced"
      groupRef.current?.setLayout({
        [FLUID_PANEL_FORUM]: 50,
        [FLUID_PANEL_AI]: 50,
      })
    }
  }, [groupRef])

  const onForumPanelResize = useCallback(
    (
      _size: PanelSize,
      _id: string | number | undefined,
      _prev: PanelSize | undefined,
    ) => {
      const w = _size.inPixels
      setForumViewCompact((prev) => {
        if (!prev && w < COMPACT_ENTER_PX) return true
        if (prev && w > COMPACT_EXIT_PX) return false
        return prev
      })
    },
    [],
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLUID_STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw) as {
        layout?: Layout
        navRailCompact?: boolean
        /** 旧版字段 */
        navCollapsed?: boolean
        preset?: FluidPreset
        lastCustom?: Layout
      }
      if (s.lastCustom && typeof s.lastCustom === "object") {
        lastCustomRef.current = s.lastCustom
      }
      if (typeof s.navRailCompact === "boolean") {
        syncNavRailCompact(s.navRailCompact)
      } else if (typeof s.navCollapsed === "boolean") {
        syncNavRailCompact(s.navCollapsed)
      }
      if (
        s.preset === "forum" ||
        s.preset === "balanced" ||
        s.preset === "ai" ||
        s.preset === "custom"
      ) {
        setPreset(s.preset)
      }
      if (s.layout && typeof s.layout === "object") {
        const lay = { ...s.layout } as Layout
        const aiPct = lay[FLUID_PANEL_AI]
        if (typeof aiPct === "number" && aiPct < FLUID_AI_MIN_PERCENT) {
          lay[FLUID_PANEL_AI] = FLUID_AI_MIN_PERCENT
          lay[FLUID_PANEL_FORUM] = 100 - FLUID_AI_MIN_PERCENT
        }
        restoringRef.current = true
        requestAnimationFrame(() => {
          groupRef.current?.setLayout(lay)
        })
      }
    } catch {
      // ignore
    }
  }, [groupRef, syncNavRailCompact])

  const value = useMemo(
    () => ({
      groupRef,
      preset,
      navRailCompact,
      toggleNavRail,
      applyPreset,
      forumViewCompact,
      aiPanelPercent,
      aiSplitLayout: aiPanelPercent >= 60,
      onLayoutChanged,
      onForumPanelResize,
      toggleBalancedVsCustom,
    }),
    [
      groupRef,
      preset,
      navRailCompact,
      toggleNavRail,
      applyPreset,
      forumViewCompact,
      aiPanelPercent,
      onLayoutChanged,
      onForumPanelResize,
      toggleBalancedVsCustom,
    ],
  )

  return (
    <FluidLayoutContext.Provider value={value}>
      {children}
    </FluidLayoutContext.Provider>
  )
}

export function useFluidLayout(): FluidLayoutContextValue | null {
  return useContext(FluidLayoutContext)
}
