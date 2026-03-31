import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  type Locale,
  type MessageKey,
  LOCALE_STORAGE_KEY,
  getMessage,
  getMessageWith,
  readStoredLocale,
} from "@/i18n/messages"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
  tWith: (
    key: MessageKey,
    vars: Record<string, string | number>,
  ) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => getMessage(locale, key),
      tWith: (key, vars) => getMessageWith(locale, key, vars),
    }),
    [locale, setLocale],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale 必须在 LocaleProvider 内使用")
  }
  return ctx
}
