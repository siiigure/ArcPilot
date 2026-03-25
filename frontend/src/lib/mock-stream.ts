function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(id)
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

export async function* streamMockText(
  text: string,
  options: {
    signal?: AbortSignal
    minDelayMs?: number
    maxDelayMs?: number
    minChunk?: number
    maxChunk?: number
  } = {},
): AsyncGenerator<string> {
  const {
    signal,
    minDelayMs = 15,
    maxDelayMs = 45,
    minChunk = 1,
    maxChunk = 3,
  } = options

  let i = 0
  while (i < text.length) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }
    const span = maxChunk - minChunk + 1
    const chunkLen = minChunk + Math.floor(Math.random() * span)
    const end = Math.min(text.length, i + chunkLen)
    yield text.slice(i, end)
    i = end
    if (i >= text.length) break
    const ms = minDelayMs + Math.random() * (maxDelayMs - minDelayMs)
    await delay(ms, signal)
  }
}
