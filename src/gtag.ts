const GA_ID = 'G-B2JLBE6TE0'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[][]
  }
}

export const gtag = (...args: unknown[]): void => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args)
  }
}

export const loadGtag = (): void => {
  if (typeof window === 'undefined') return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  gtag('js', new Date())
  gtag('config', GA_ID)
}
