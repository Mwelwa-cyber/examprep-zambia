/**
 * ZedExams Logo component
 *
 * Assets in /public:
 *   /public/logo.png       — ZedExams logo
 *
 * Props:
 *   variant:   'full' | 'icon'
 *   size:      'sm' | 'md' | 'lg' | 'xl'
 *   className: extra tailwind classes
 */
export default function Logo({ variant = 'full', size = 'md', className = '' }) {
  const logoSrc = '/zedexams-logo.png?v=3'
  // Heights for the full logo (wider landscape image)
  const fullH = { sm: 'h-14', md: 'h-20', lg: 'h-28', xl: 'h-40' }
  // Sizes for the square icon
  const iconH = { sm: 'h-12 w-12', md: 'h-14 w-14', lg: 'h-20 w-20', xl: 'h-28 w-28' }

  if (variant === 'icon') {
    return (
      <img
        src={logoSrc}
        alt="ZedExams"
        className={`${iconH[size] ?? iconH.md} object-contain flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <img
      src={logoSrc}
      alt="ZedExams"
      className={`${fullH[size] ?? fullH.md} w-auto object-contain flex-shrink-0 ${className}`}
    />
  )
}
