import { Appearance } from "@/components/Common/Appearance"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#cfe8a0] dark:bg-[#1f2b1d] lg:flex lg:items-center lg:justify-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#9cc85f_0%,#cfe8a0_42%,#f8fdf0_100%)] dark:bg-[linear-gradient(90deg,#162015_0%,#223122_45%,#314132_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.75)_0.6px,transparent_0.6px)] [background-size:6px_6px] dark:opacity-[0.08] dark:[background-image:radial-gradient(rgba(0,0,0,0.45)_0.6px,transparent_0.6px)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.14)_0%,transparent_52%,rgba(255,255,255,0.1)_100%)] dark:bg-[linear-gradient(125deg,rgba(255,255,255,0.04)_0%,transparent_55%,rgba(255,255,255,0.03)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-[#fbfef5] to-transparent blur-2xl dark:from-[#4a5a48]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-px bg-white/20 dark:bg-black/20"
          />

          <div className="relative z-10 flex max-w-md flex-col items-center gap-6 px-10 text-center">
            <div className="space-y-2">
              <h2 className="text-5xl font-extrabold tracking-tight text-black dark:text-white">
                ArcPilot
              </h2>
              <p className="text-xl font-medium text-black/85 dark:text-white/90">
                Attention is all you need.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-6 md:p-10">
          <div className="flex justify-end">
            <Appearance />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
