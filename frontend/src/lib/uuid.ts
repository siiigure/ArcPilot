/** 宽松校验 UUID（用于 URL query，非法则视为未传） */
export function isUuidString(value: string | undefined): value is string {
  if (!value || typeof value !== "string") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  )
}
