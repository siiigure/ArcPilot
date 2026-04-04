import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { PostsService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import { useLocale } from "@/contexts/locale-context"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

type DeletePostDialogProps = {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 详情页删除后回到首页 */
  navigateHomeOnSuccess?: boolean
}

export function DeletePostDialog({
  postId,
  open,
  onOpenChange,
  navigateHomeOnSuccess = false,
}: DeletePostDialogProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => PostsService.deletePost({ postId }),
    onSuccess: async () => {
      showSuccessToast(t("post.deleteSuccess"))
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ["feedPosts"] })
      await queryClient.invalidateQueries({ queryKey: ["post", postId] })
      await queryClient.invalidateQueries({ queryKey: ["postReplies", postId] })
      await queryClient.invalidateQueries({ queryKey: ["userPosts"] })
      await queryClient.invalidateQueries({ queryKey: ["userAnsweredPosts"] })
      await queryClient.invalidateQueries({ queryKey: ["postSearch"] })
      if (navigateHomeOnSuccess) {
        await navigate({ to: "/" })
      }
    },
    onError: handleError.bind(showErrorToast),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("post.deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("post.deleteConfirmBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("post.deleteCancel")}
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t("post.deleteConfirm")}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
