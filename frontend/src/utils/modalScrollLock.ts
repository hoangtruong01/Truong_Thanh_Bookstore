let locks = 0
let previousOverflow = ''

export function lockModalScroll(): () => void {
  if (locks === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  locks++
  let released = false
  return () => {
    if (released) return
    released = true
    locks--
    if (locks === 0) document.body.style.overflow = previousOverflow
  }
}
