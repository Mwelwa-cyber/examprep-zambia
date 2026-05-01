// Lazy-loads Fraunces (italic) + Bricolage Grotesque used by the Pro
// celebration page and paywall modal. Skips if the link is already present.
export function ensureProFonts() {
  if (typeof document === 'undefined') return
  if (document.querySelector('link[data-zwp-fonts]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&display=swap'
  link.setAttribute('data-zwp-fonts', '1')
  document.head.appendChild(link)
}
