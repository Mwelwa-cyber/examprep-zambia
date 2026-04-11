/**
 * ExamPrep Zambia Logo component — uses actual PNG assets
 *
 * Place your files in /public:
 *   /public/logo.png       — full logo (icon + EXAMS PREP ZAMBIA + tagline)
 *   /public/logo-icon.png  — square app icon (green rounded background)
 *
 * Props:
 *   variant: 'full' | 'icon'
 *   size:    'sm' | 'md' | 'lg' | 'xl'
 *   className: extra tailwind classes
 */
export default function Logo({ variant = 'full', size = 'md', className = '' }) {
  // Heights for the full logo (wide image)
  const fullH = { sm: 'h-9', md: 'h-14', lg: 'h-20', xl: 'h-32' }
  // Heights for the icon (square image)
  const iconH = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14', xl: 'h-20 w-20' }

  if (variant === 'icon') {
    return (
      <img
        src="/logo-icon.png"
        alt="ExamPrep Zambia"
        className={`${iconH[size] ?? iconH.md} object-contain flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <img
      src="/logo.png"
      alt="ExamPrep Zambia — Practice Smart. Pass Confidently."
      className={`${fullH[size] ?? fullH.md} w-auto object-contain flex-shrink-0 ${className}`}
    />
  )
}
