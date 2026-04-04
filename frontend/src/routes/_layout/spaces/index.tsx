import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft, FolderKanban, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/contexts/locale-context"
import { getMessageWith } from "@/i18n/messages"
import {
  acceptInvite,
  createSpace,
  formatBytes,
  listSpaces,
} from "@/lib/spaces-api"

export const Route = createFileRoute("/_layout/spaces/")({
  component: CollabSpacesListPage,
  head: () => ({
    meta: [{ title: "协作空间 — Arcpilot" }],
  }),
})

function CollabSpacesListPage() {
  const { locale, t } = useLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [quotaStr, setQuotaStr] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  const listQuery = useQuery({
    queryKey: ["collabSpaces"],
    queryFn: listSpaces,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createSpace({
        name: name.trim(),
        description: description.trim() || undefined,
        storage_quota: quotaStr.trim()
          ? Number.parseInt(quotaStr.trim(), 10)
          : undefined,
      }),
    onSuccess: () => {
      toast.success("创建成功")
      setOpen(false)
      setName("")
      setDescription("")
      setQuotaStr("")
      void queryClient.invalidateQueries({ queryKey: ["collabSpaces"] })
    },
    onError: (e: Error) => {
      toast.error(e.message || "创建失败")
    },
  })

  const joinMutation = useMutation({
    mutationFn: () => acceptInvite({ invite_code: inviteCode.trim() }),
    onSuccess: (data) => {
      toast.success("已加入协作空间")
      setInviteCode("")
      void queryClient.invalidateQueries({ queryKey: ["collabSpaces"] })
      void queryClient.invalidateQueries({
        queryKey: ["collabSpace", data.space_id],
      })
    },
    onError: (e: Error) => {
      toast.error(e.message || "加入失败")
    },
  })

  const spaces = listQuery.data?.data ?? []

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("post.backHome")}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("collabSpaces.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("collabSpaces.listSubtitle")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-sm text-gray-600 transition-all hover:bg-gray-100/50 sm:w-auto sm:max-w-sm sm:shrink-0 sm:items-center sm:gap-3 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <div className="mt-0.5 shrink-0 rounded-lg bg-gray-200/50 p-1.5 transition-transform group-hover:scale-110 sm:mt-0 dark:bg-white/10">
                <Plus className="h-4 w-4" />
              </div>
              <span className="min-w-0 flex-1 font-medium">
                <span className="block">{t("collabSpaces.create")}</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-snug text-muted-foreground">
                  {t("sidebar.collabSpacesHint")}
                </span>
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("collabSpaces.create")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="cs-name">{t("collabSpaces.name")}</Label>
                <Input
                  id="cs-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("collabSpaces.name")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cs-desc">{t("collabSpaces.description")}</Label>
                <Input
                  id="cs-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cs-quota">{t("collabSpaces.quotaHint")}</Label>
                <Input
                  id="cs-quota"
                  inputMode="numeric"
                  value={quotaStr}
                  onChange={(e) => setQuotaStr(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                disabled={!name.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending
                  ? t("collabSpaces.loading")
                  : t("collabSpaces.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {listQuery.isLoading ? (
        <div className="py-8 text-sm text-muted-foreground">
          {t("collabSpaces.loading")}
        </div>
      ) : listQuery.isError ? (
        <div className="py-8 text-sm text-red-600">
          {t("collabSpaces.error")}
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {t("collabSpaces.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {spaces.map((s) => (
            <li key={s.id}>
              <Link
                to="/spaces/$spaceId"
                params={{ spaceId: s.id }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-[#82ba00]/40"
              >
                <div className="rounded-lg bg-[#82ba00]/15 p-2 text-[#82ba00]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name}</div>
                  {s.description ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {getMessageWith(locale, "collabSpaces.usedQuota", {
                        used: formatBytes(s.used_storage),
                        total: formatBytes(s.storage_quota),
                      })}
                    </span>
                    <span>
                      {t("collabSpaces.yourRole")}: {s.current_user_role}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-4">
        <h2 className="mb-3 text-sm font-semibold">
          {t("collabSpaces.joinByCode")}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={t("collabSpaces.inviteCodePlaceholder")}
            className="sm:flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!inviteCode.trim() || joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
          >
            {joinMutation.isPending
              ? t("collabSpaces.loading")
              : t("collabSpaces.join")}
          </Button>
        </div>
      </div>
    </div>
  )
}
