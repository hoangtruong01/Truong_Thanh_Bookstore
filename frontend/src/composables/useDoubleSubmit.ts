import { ref, reactive } from 'vue'

export interface DoubleSubmitOptions {
  cooldownMs?: number
}

/**
 * Composable for single-action double-submit protection
 * (e.g., checkout order, login form, apply coupon)
 */
export function useDoubleSubmit(defaultOptions: DoubleSubmitOptions | number = { cooldownMs: 300 }) {
  const defaultCooldown = typeof defaultOptions === 'number' ? defaultOptions : (defaultOptions.cooldownMs ?? 300)
  const isSubmitting = ref(false)

  async function runProtected<T>(
    fn: () => Promise<T>,
    options?: DoubleSubmitOptions | number
  ): Promise<T | undefined> {
    if (isSubmitting.value) {
      return undefined
    }

    isSubmitting.value = true
    const cooldown = typeof options === 'number'
      ? options
      : (options?.cooldownMs ?? defaultCooldown)

    try {
      return await fn()
    } finally {
      if (cooldown > 0) {
        setTimeout(() => {
          isSubmitting.value = false
        }, cooldown)
      } else {
        isSubmitting.value = false
      }
    }
  }

  return {
    isSubmitting,
    runProtected,
  }
}

/**
 * Composable for key-based multi-action double-submit protection
 * (e.g., cancel button on multiple order rows, or add-to-cart on product cards)
 */
export function useKeyedDoubleSubmit(defaultCooldownMs = 300) {
  const submittingKeys = reactive<Record<string, boolean>>({})

  function isKeySubmitting(key: string): boolean {
    return !!submittingKeys[key]
  }

  async function runKeyProtected<T>(
    key: string,
    fn: () => Promise<T>,
    options?: DoubleSubmitOptions | number
  ): Promise<T | undefined> {
    if (submittingKeys[key]) {
      return undefined
    }

    submittingKeys[key] = true
    const cooldown = typeof options === 'number'
      ? options
      : (options?.cooldownMs ?? defaultCooldownMs)

    try {
      return await fn()
    } finally {
      if (cooldown > 0) {
        setTimeout(() => {
          delete submittingKeys[key]
        }, cooldown)
      } else {
        delete submittingKeys[key]
      }
    }
  }

  return {
    submittingKeys,
    isKeySubmitting,
    runKeyProtected,
  }
}
