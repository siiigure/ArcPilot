import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import axios from "axios"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ApiError, OpenAPI } from "./client"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { LocaleProvider } from "./contexts/locale-context"
import "./index.css"
import { routeTree } from "./routeTree.gen"

// 无超时则后端若未就绪/卡在启动，登录会一直 pending；给明确上限并触发 onError 结束 loading
axios.defaults.timeout = 90_000

// 开发：见 frontend/.env 走 Vite 代理；生产：可留空用同源 window.location.origin
const envBase = import.meta.env.VITE_API_URL
const trimmed =
  typeof envBase === "string" && envBase.trim() !== ""
    ? envBase.replace(/\/$/, "")
    : ""
OpenAPI.BASE =
  trimmed || (typeof window !== "undefined" ? window.location.origin : "")
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || ""
}

const handleApiError = (error: Error) => {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token")
    window.location.href = "/login"
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="vite-ui-theme"
    >
      <LocaleProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster richColors closeButton />
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)
