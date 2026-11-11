import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import {
  endOfToday,
  splitDuration,
  startOfTomorrow,
  toTimestamp,
  useCountdown,
  type CountdownTarget,
} from '../useCountdown'

const HOUR = 60 * 60 * 1000

describe('useCountdown helpers', () => {
  it('splitDuration pads each part and does not cap hours at 24', () => {
    expect(splitDuration(0)).toEqual({ hours: '00', minutes: '00', seconds: '00' })
    expect(splitDuration(HOUR + 2 * 60_000 + 3_999)).toEqual({ hours: '01', minutes: '02', seconds: '03' })
    expect(splitDuration(100 * HOUR).hours).toBe('100')
  })

  it('splitDuration clamps negative durations to zero', () => {
    expect(splitDuration(-5_000)).toEqual({ hours: '00', minutes: '00', seconds: '00' })
  })

  it('toTimestamp accepts dates, ISO strings and epoch ms; rejects empty and invalid input', () => {
    const iso = '2026-11-10T10:00:00.000Z'
    const ms = Date.parse(iso)
    expect(toTimestamp(new Date(iso))).toBe(ms)
    expect(toTimestamp(iso)).toBe(ms)
    expect(toTimestamp(ms)).toBe(ms)
    expect(toTimestamp(null)).toBeNull()
    expect(toTimestamp(undefined)).toBeNull()
    expect(toTimestamp('')).toBeNull()
    expect(toTimestamp('not-a-date')).toBeNull()
  })

  it('startOfTomorrow is the next local midnight; endOfToday is 23:59:59.999', () => {
    const now = new Date(2026, 10, 10, 15, 30, 0, 0)
    expect(startOfTomorrow(now).getTime()).toBe(new Date(2026, 10, 11, 0, 0, 0, 0).getTime())
    expect(endOfToday(now).getTime()).toBe(new Date(2026, 10, 10, 23, 59, 59, 999).getTime())
    // input is not mutated
    expect(now.getHours()).toBe(15)
  })
})

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 10, 10, 0, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down to a fixed expiry and ticks every second', () => {
    const scope = effectScope()
    const c = scope.run(() => useCountdown(new Date(Date.now() + 2 * HOUR + 5_000)))!

    expect(c.isActive.value).toBe(true)
    expect(c.formatted.value).toBe('02:00:05')

    vi.advanceTimersByTime(3_000)
    expect(c.formatted.value).toBe('02:00:02')
    expect(c.hours.value).toBe('02')
    expect(c.minutes.value).toBe('00')
    expect(c.seconds.value).toBe('02')
    scope.stop()
  })

  it('reports expiry and clamps to 00:00:00', () => {
    const scope = effectScope()
    const c = scope.run(() => useCountdown(Date.now() + 2_000))!
    expect(c.isExpired.value).toBe(false)

    vi.advanceTimersByTime(2_000)
    expect(c.isExpired.value).toBe(true)
    expect(c.remainingMs.value).toBe(0)
    expect(c.formatted.value).toBe('00:00:00')

    vi.advanceTimersByTime(5_000)
    expect(c.formatted.value).toBe('00:00:00')
    scope.stop()
  })

  it('is inactive and runs no interval without a valid target', () => {
    const scope = effectScope()
    const c = scope.run(() => useCountdown(null))!
    expect(c.isActive.value).toBe(false)
    expect(c.isExpired.value).toBe(false)
    expect(c.remainingMs.value).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('starts, restarts and stops when a reactive target changes', async () => {
    const target = ref<CountdownTarget>(null)
    const scope = effectScope()
    const c = scope.run(() => useCountdown(target))!
    expect(vi.getTimerCount()).toBe(0)

    target.value = new Date(Date.now() + 60_000).toISOString()
    await nextTick()
    expect(c.formatted.value).toBe('00:01:00')
    expect(vi.getTimerCount()).toBe(1)

    target.value = new Date(Date.now() + HOUR).toISOString()
    await nextTick()
    expect(c.formatted.value).toBe('01:00:00')
    expect(vi.getTimerCount()).toBe(1)

    target.value = null
    await nextTick()
    expect(c.isActive.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
    scope.stop()
  })

  it('legacy "end of today" mode re-reads the getter and rolls over at midnight', () => {
    vi.setSystemTime(new Date(2026, 10, 10, 23, 59, 58, 0))
    const scope = effectScope()
    const c = scope.run(() => useCountdown(startOfTomorrow))!
    expect(c.formatted.value).toBe('00:00:02')

    vi.advanceTimersByTime(3_000) // now 00:00:01 next day
    expect(c.isExpired.value).toBe(false)
    expect(c.formatted.value).toBe('23:59:59')
    scope.stop()
  })

  it('endOfToday mode matches the header timer (one millisecond before midnight)', () => {
    const scope = effectScope()
    const c = scope.run(() => useCountdown(endOfToday))!
    // 10:00:00.000 → 23:59:59.999 is 13h 59m 59.999s
    expect(c.formatted.value).toBe('13:59:59')
    scope.stop()
  })

  it('clears its interval when the effect scope stops', () => {
    const scope = effectScope()
    scope.run(() => useCountdown(Date.now() + HOUR))
    expect(vi.getTimerCount()).toBe(1)
    scope.stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears its interval when the owning component unmounts', () => {
    const Comp = defineComponent({
      setup() {
        const { formatted } = useCountdown(() => Date.now() + HOUR)
        return () => h('span', formatted.value)
      },
    })
    const setSpy = vi.spyOn(globalThis, 'setInterval')
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(Comp)
    expect(wrapper.text()).toBe('01:00:00')
    expect(setSpy).toHaveBeenCalledTimes(1)
    const id = setSpy.mock.results[0].value
    expect(clearSpy).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(clearSpy).toHaveBeenCalledWith(id)
    setSpy.mockRestore()
    clearSpy.mockRestore()
  })
})
