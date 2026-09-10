import { ref, type Ref } from 'vue'

export interface SubmitLockOptions {
  /**
   * Minimum duration in milliseconds to keep the lock active,
   * preventing rapid double-clicks even on near-instant responses.
   * Default: 400ms.
   */
  minDurationMs?: number
}

export function useSubmitLock(options: SubmitLockOptions = {}) {
  const minDurationMs = options.minDurationMs ?? 400
  const isSubmitting: Ref<boolean> = ref(false)

  async function withSubmitLock<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (isSubmitting.value) {
      return undefined
    }

    isSubmitting.value = true
    const startTime = Date.now()

    try {
      return await fn()
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = minDurationMs - elapsed
      if (remaining > 0) {
        setTimeout(() => {
          isSubmitting.value = false
        }, remaining)
      } else {
        isSubmitting.value = false
      }
    }
  }

  return {
    isSubmitting,
    withSubmitLock,
  }
}
