import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            // Once revealed, we don't need to observe it anymore
            observer?.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -10px 0px', // Trigger slightly earlier to avoid lag on mobile/fast scroll
      }
    )

    // Observe elements with reveal classes
    const elementsToReveal = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    )
    elementsToReveal.forEach((el) => observer?.observe(el))
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  // Expose a function to manually observe new dynamic elements
  const observeNewElements = () => {
    if (!observer) return
    const elementsToReveal = document.querySelectorAll(
      '.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed)'
    )
    elementsToReveal.forEach((el) => observer?.observe(el))
  }

  return {
    observeNewElements,
  }
}
