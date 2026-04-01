import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronLeft, Download, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth from "@/hooks/useAuth"
import { useLocale } from "@/contexts/locale-context"
import { getMessageWith } from "@/i18n/messages"
import {
  completeAssetUpload,
  createSpaceInvite,
  deleteSpaceAsset,
  downloadSpaceAsset,
  formatBytes,
  getSpace,
  listSpaceAssets,
  listSpaceMembers,
  presignAssetUpload,
  removeSpaceMember,
  resolveUploadUrl,
  updateSpaceMemberRole,
} from "@/lib/spaces-api"

export const Route = createFileRoute("/_layout/spaces/$spaceId")({
  component: CollabSpaceDetailPage,
})

function CollabSpaceDetailPage() {
  const { spaceId } = Route.useParams()
  const { locale, t } = useLocale()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer")

  const spaceQuery = useQuery({
    queryKey: ["collabSpace", spaceId],
    queryFn: () => getSpace(spaceId),
  })

  const membersQuery = useQuery({
    queryKey: ["collabSpaceMembers", spaceId],
    queryFn: () => listSpaceMembers(spaceId),
    enabled: spaceQuery.isSuccess,
  })

  const assetsQuery = useQuery({
    queryKey: ["collabSpaceAssets", spaceId],
    queryFn: () => listSpaceAssets(spaceId, false),
    enabled: spaceQuery.isSuccess,
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      createSpaceInvite(spaceId, { role: inviteRole, expires_in_days: 7 }),
    onSuccess: (data) => {
      toast.success(`${t("collabSpaces.inviteCode")}: ${data.invite_code}`)
      void navigator.clipboard.writeText(data.invite_code)
    },
    onError: (e: Error) => {
      toast.error(e.message || "邀请失败")
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const presign = await presignAssetUpload(spaceId, {
        logical_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
      })
      const url = resolveUploadUrl(presign.upload_url)
      const put = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })
      if (!put.ok) {
        throw new Error(`上传失败: ${put.status}`)
      }
      await completeAssetUpload(spaceId, {
        upload_token: presign.upload_token,
      })
    },
    onSuccess: () => {
      toast.success("上传完成")
      void queryClient.invalidateQueries({
        queryKey: ["collabSpace", spaceId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["collabSpaceAssets", spaceId],
      })
    },
    onError: (e: Error) => {
      toast.error(e.message || "上传失败")
    },
  })

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: number) => deleteSpaceAsset(spaceId, assetId),
    onSuccess: () => {
      toast.success("已删除")
      void queryClient.invalidateQueries({
        queryKey: ["collabSpace", spaceId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["collabSpaceAssets", spaceId],
      })
    },
    onError: (e: Error) => {
      toast.error(e.message || "删除失败")
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: (v: { memberUserId: string; role: "editor" | "viewer" }) =>
      updateSpaceMemberRole(spaceId, v.memberUserId, { role: v.role }),
    onSuccess: () => {
      toast.success("角色已更新")
      void queryClient.invalidateQueries({
        queryKey: ["collabSpaceMembers", spaceId],
      })
    },
    onError: (e: Error) => {
      toast.error(e.message || "更新角色失败")
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId: string) => removeSpaceMember(spaceId, memberUserId),
    onSuccess: () => {
      toast.success("已移除成员")
      void queryClient.invalidateQueries({
        queryKey: ["collabSpaceMembers", spaceId],
      })
    },
    onError: (e: Error) => {
      toast.error(e.message || "移除成员失败")
    },
  })

  const space = spaceQuery.data
  const role = space?.current_user_role ?? ""
  const canUpload = role === "owner" || role === "editor"
  const canInvite = role === "owner"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) uploadMutation.mutate(file)
  }

  if (spaceQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-8 text-sm text-muted-foreground">
        {t("collabSpaces.loading")}
      </div>
    )
  }

  if (spaceQuery.isError || !space) {
    return (
      <div className="mx-auto max-w-3xl py-8 text-sm text-red-600">
        {t("collabSpaces.error")}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <Link
        to="/spaces"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-[#82ba00]"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("collabSpaces.backList")}
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{space.name}</h1>
        {space.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{space.description}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {getMessageWith(locale, "collabSpaces.usedQuota", {
            used: formatBytes(space.used_storage),
            total: formatBytes(space.storage_quota),
          })}{" "}
          · {t("collabSpaces.yourRole")}: {space.current_user_role}
        </p>
      </header>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assets">{t("collabSpaces.tabAssets")}</TabsTrigger>
          <TabsTrigger value="members">{t("collabSpaces.tabMembers")}</TabsTrigger>
          {canInvite ? (
            <TabsTrigger value="invite">{t("collabSpaces.tabInvite")}</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {canUpload ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                {t("collabSpaces.uploadHint")}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadMutation.isPending
                  ? t("collabSpaces.loading")
                  : t("collabSpaces.upload")}
              </Button>
            </div>
          ) : null}

          {assetsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              {t("collabSpaces.loading")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("collabSpaces.name")}</TableHead>
                  <TableHead>{t("collabSpaces.assetVersion")}</TableHead>
                  <TableHead>{t("collabSpaces.assetType")}</TableHead>
                  <TableHead className="text-right">
                    {t("collabSpaces.assetSize")}
                  </TableHead>
                  <TableHead className="w-[120px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(assetsQuery.data?.data ?? []).map((a) => {
                  const canDel =
                    role === "owner" ||
                    (role === "editor" && user?.id === a.uploader_id)
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.logical_name}</TableCell>
                      <TableCell>{a.version}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell className="text-right">
                        {formatBytes(a.size)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mr-1"
                          aria-label="download"
                          onClick={() =>
                            void downloadSpaceAsset(spaceId, a.id, a.logical_name)
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canDel ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={deleteAssetMutation.isPending}
                            onClick={() => deleteAssetMutation.mutate(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {(assetsQuery.data?.data ?? []).length === 0 &&
          !assetsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("collabSpaces.noAssets")}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="members">
          {membersQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              {t("collabSpaces.loading")}
            </div>
          ) : (
            <ul className="space-y-2">
              {(membersQuery.data?.data ?? []).map((m) => (
                <li
                  key={m.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{m.full_name || m.email}</span>
                    <span className="text-xs text-muted-foreground">{m.role}</span>
                  </div>
                  {canInvite && m.role !== "owner" ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          updateMemberRoleMutation.mutate({
                            memberUserId: m.user_id,
                            role: v as "editor" | "viewer",
                          })
                        }
                        disabled={updateMemberRoleMutation.isPending}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">editor</SelectItem>
                          <SelectItem value="viewer">viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={removeMemberMutation.isPending}
                        onClick={() => removeMemberMutation.mutate(m.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {canInvite ? (
          <TabsContent value="invite" className="space-y-4">
            <div className="grid gap-2 sm:max-w-xs">
              <Label>{t("collabSpaces.inviteRole")}</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">editor</SelectItem>
                  <SelectItem value="viewer">viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              {t("collabSpaces.generateInvite")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("collabSpaces.inviteHint")}
            </p>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
