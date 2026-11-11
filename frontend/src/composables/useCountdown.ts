import { computed, getCurrentScope, onScopeDispose, readonly, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

/** Anything `new Date()` accepts; null/undefined/'' (or an invalid date) means "no countdown". */
export type CountdownTarget = Date | string | number | null | undefined

export interface CountdownParts {
  hours: string
  minutes: string
  seconds: string
}

export interface UseCountdownOptions {
  /** Tick length in ms (default 1000). */
  intervalMs?: number
  /** Clock source, injectable for tests (default Date.now). */
  now?: () => number
}

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

const pad2 = (n: number) => n.toString().padStart(2, '0')

/** Midnight at the start of tomorrow, local time (the "deal ends today" timers on Home / DealHot). */
export function startOfTomorrow(now: Date = new Date()): Date {
  const d = new Date(now.getTime())
  d.setHours(24, 0, 0, 0)
  return d
}

/** 23:59:59.999 today, local time (the header flash-sale timer in CustomerLayout). */
export function endOfToday(now: Date = new Date()): Date {
  const d = new Date(now.getTime())
  d.setHours(23, 59, 59, 999)
  return d
}

/** Epoch ms for a target, or null when it is empty or not a valid date. */
export function toTimestamp(target: CountdownTarget): number | null {
  if (target === null || target === undefined || target === '') return null
  const ms = target instanceof Date ? target.getTime() : new Date(target).getTime()
  return Number.isNaN(ms) ? null : ms
}

/** Splits a duration into zero-padded HH / MM / SS. Hours are not capped at 24; negatives clamp to 0. */
export function splitDuration(ms: number): CountdownParts {
  const safe = Math.max(0, ms)
  return {
    hours: pad2(Math.floor(safe / HOUR_MS)),
    minutes: pad2(Math.floor((safe % HOUR_MS) / MINUTE_MS)),
    seconds: pad2(Math.floor((safe % MINUTE_MS) / 1000)),
  }
}

/**
 * Live countdown to `target`, re-read on every tick so a getter such as `startOfTomorrow`
 * rolls over to the next day by itself (the legacy "ends today" mode).
 *
 * - `useCountdown(() => product.flashSaleExpiry)` counts to a fixed expiry.
 * - `useCountdown(startOfTomorrow)` / `useCountdown(endOfToday)` count to the end of the day.
 *
 * The interval only runs while there is a valid target, restarts when the target changes,
 * and is cleared automatically when the owning component unmounts (or effect scope stops).
 */
export function useCountdown(target: MaybeRefOrGetter<CountdownTarget>, options: UseCountdownOptions = {}) {
  const intervalMs = options.intervalMs ?? 1000
  const now = options.now ?? Date.now

  /** Remaining ms (clamped at 0), or null when there is no valid target. */
  const remainingMs = ref<number | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  function update() {
    const ts = toTimestamp(toValue(target))
    remainingMs.value = ts === null ? null : Math.max(0, ts - now())
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    if (timer === null) timer = setInterval(update, intervalMs)
  }

  watch(
    () => toTimestamp(toValue(target)),
    (ts) => {
      update()
      if (ts === null) stop()
      else start()
    },
    { immediate: true },
  )

  if (getCurrentScope()) onScopeDispose(stop)

  const parts = computed(() => splitDuration(remainingMs.value ?? 0))

  return {
    remainingMs: readonly(remainingMs),
    hours: computed(() => parts.value.hours),
    minutes: computed(() => parts.value.minutes),
    seconds: computed(() => parts.value.seconds),
    /** `HH:MM:SS`; "00:00:00" when expired or without a target. */
    formatted: computed(() => `${parts.value.hours}:${parts.value.minutes}:${parts.value.seconds}`),
    /** True while there is a valid target (expired or not). */
    isActive: computed(() => remainingMs.value !== null),
    /** True once a valid target has been reached. */
    isExpired: computed(() => remainingMs.value !== null && remainingMs.value <= 0),
    stop,
  }
}
