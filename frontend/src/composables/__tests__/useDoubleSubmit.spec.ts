import { describe, it, expect, vi, afterEach } from 'vitest'
import { useDoubleSubmit, useKeyedDoubleSubmit } from '../useDoubleSubmit'

describe('useDoubleSubmit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('prevents concurrent execution of protected function with cooldown 0', async () => {
    const { isSubmitting, runProtected } = useDoubleSubmit(0)
    let executionCount = 0

    const slowFn = () => new Promise<string>((resolve) => {
      setTimeout(() => {
        executionCount++
        resolve('done')
      }, 50)
    })

    const p1 = runProtected(slowFn)
    expect(isSubmitting.value).toBe(true)

    // Second call while p1 is running should be blocked
    const p2 = runProtected(slowFn)

    const [res1, res2] = await Promise.all([p1, p2])

    expect(res1).toBe('done')
    expect(res2).toBeUndefined()
    expect(executionCount).toBe(1)
    expect(isSubmitting.value).toBe(false)
  })

  it('resets submitting state even when inner function throws an error', async () => {
    const { isSubmitting, runProtected } = useDoubleSubmit(0)

    const failingFn = () => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API failure')), 20)
    })

    await expect(runProtected(failingFn)).rejects.toThrow('API failure')
    expect(isSubmitting.value).toBe(false)
  })

  it('maintains cooldown after inner function completes', async () => {
    vi.useFakeTimers()
    const { isSubmitting, runProtected } = useDoubleSubmit(0)

    const fastFn = vi.fn().mockResolvedValue('ok')

    const p = runProtected(fastFn, 200)
    await p

    expect(isSubmitting.value).toBe(true)

    // Advance time past cooldown
    vi.advanceTimersByTime(250)
    expect(isSubmitting.value).toBe(false)
  })
})

describe('useKeyedDoubleSubmit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('blocks duplicate submission for the same key while allowing different keys concurrently', async () => {
    const { isKeySubmitting, runKeyProtected } = useKeyedDoubleSubmit(0)
    const executions: string[] = []

    const makeTask = (id: string) => () => new Promise<string>((resolve) => {
      setTimeout(() => {
        executions.push(id)
        resolve(id)
      }, 40)
    })

    const p1 = runKeyProtected('key-A', makeTask('A1'))
    const p2 = runKeyProtected('key-A', makeTask('A2')) // should be ignored
    const p3 = runKeyProtected('key-B', makeTask('B1')) // should run in parallel

    expect(isKeySubmitting('key-A')).toBe(true)
    expect(isKeySubmitting('key-B')).toBe(true)

    const [resA1, resA2, resB1] = await Promise.all([p1, p2, p3])

    expect(resA1).toBe('A1')
    expect(resA2).toBeUndefined()
    expect(resB1).toBe('B1')
    expect(executions).toEqual(['A1', 'B1'])
    expect(isKeySubmitting('key-A')).toBe(false)
    expect(isKeySubmitting('key-B')).toBe(false)
  })
})
