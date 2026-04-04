import { useSyncExternalStore } from "react"

const QUERY = "(min-width: 1024px)"

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

/** 无 SSR 时仅满足 useSyncExternalStore 签名；首帧按桌面渲染减少壳层闪烁 */
function getServerSnapshot() {
  return true
}

export function useIsLargeScreen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
