/**
 * ZedExams Logo component
 *
 * Assets in /public:
 *   /public/logo.svg       — full stacked logo (book + ZedExams + Practise smart.)
 *   /public/logo-icon.svg  — square app icon (blue rounded bg + book/leaf)
 *
 * Props:
 *   variant:   'full' | 'icon'
 *   size:      'sm' | 'md' | 'lg' | 'xl'
 *   className: extra tailwind classes
 */
export default function Logo({ variant = 'full', size = 'md', className = '' }) {
  // Heights for the full logo (wider landscape image)
  const fullH = { sm: 'h-9', md: 'h-12', lg: 'h-20', xl: 'h-28' }
  // Sizes for the square icon
  const iconH = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14', xl: 'h-20 w-20' }

  if (variant === 'icon') {
    return (
      <img
        src="/logo-icon.svg"
        alt="ZedExams"
        className={`${iconH[size] ?? iconH.md} object-contain flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <img
      src="/logo.svg"
      alt="ZedExams — Practise smart."
      className={`${fullH[size] ?? fullH.md} w-auto object-contain flex-shrink-0 ${className}`}
    />
  )
}
