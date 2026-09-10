import { describe, it, expect, vi } from 'vitest'
import { useSubmitLock } from '../useSubmitLock'

describe('useSubmitLock (FE-05 Anti-Double Submit)', () => {
  it('prevents concurrent executions while an action is in flight', async () => {
    const { isSubmitting, withSubmitLock } = useSubmitLock({ minDurationMs: 50 })
    let callCount = 0

    const mockAction = async () => {
      callCount++
      await new Promise((resolve) => setTimeout(resolve, 30))
      return 'success'
    }

    expect(isSubmitting.value).toBe(false)

    // Fire 5 rapid calls concurrently
    const p1 = withSubmitLock(mockAction)
    const p2 = withSubmitLock(mockAction)
    const p3 = withSubmitLock(mockAction)
    const p4 = withSubmitLock(mockAction)
    const p5 = withSubmitLock(mockAction)

    expect(isSubmitting.value).toBe(true)

    const [res1, res2, res3, res4, res5] = await Promise.all([p1, p2, p3, p4, p5])

    // Exactly 1 call executed
    expect(callCount).toBe(1)
    expect(res1).toBe('success')
    expect(res2).toBeUndefined()
    expect(res3).toBeUndefined()
    expect(res4).toBeUndefined()
    expect(res5).toBeUndefined()

    // Wait for cooldown
    await new Promise((r) => setTimeout(r, 60))
    expect(isSubmitting.value).toBe(false)
  })

  it('resets isSubmitting even if the action throws an error', async () => {
    const { isSubmitting, withSubmitLock } = useSubmitLock({ minDurationMs: 20 })

    const failingAction = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      throw new Error('Action failed')
    }

    await expect(withSubmitLock(failingAction)).rejects.toThrow('Action failed')

    // Wait for cooldown
    await new Promise((r) => setTimeout(r, 30))
    expect(isSubmitting.value).toBe(false)
  })
})
