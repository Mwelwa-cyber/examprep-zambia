import { forwardRef } from 'react'

/**
 * Button — the single source of truth for clickable rectangles.
 *
 * Replaces inline `bg-green-600 hover:bg-green-700 text-white font-black …`
 * classes scattered across the app with one primitive.
 *
 * Variants
 *   • primary   — filled accent, for the main action on a surface
 *   • secondary — bordered card, for neutral actions (Cancel, Back)
 *   • ghost     — transparent, for tertiary actions (Learn more, See all)
 *   • danger    — filled red, for destructive actions (Delete, Sign out)
 *
 * Sizes
 *   • sm — dense toolbar buttons, inline controls
 *   • md — default (forms, cards)
 *   • lg — primary CTAs on auth and hero surfaces
 *
 * Props
 *   leadingIcon  — element rendered on the left (usually a Lucide icon)
 *   trailingIcon — element rendered on the right
 *   loading      — shows spinner, disables click
 *   disabled     — reduces opacity, disables click
 *   fullWidth    — stretches to parent width
 *   type         — defaults to "button" (never accidentally submits forms)
 *   as           — render as a different element (e.g., "a" for links)
 *
 * Interaction
 *   • hover       → 1 px lift
 *   • active      → press animation (scale 0.97)
 *   • focus-visible → global accent ring (set up in index.css)
 */

const BASE =
  'inline-flex items-center justify-center gap-2 font-black font-body ' +
  'select-none cursor-pointer transition-all ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'active:scale-[0.97]'

const SIZE = {
  sm: 'px-3.5 py-1.5 text-[13px] rounded-[10px] min-h-0',
  md: 'px-5 py-2.5 text-sm rounded-[12px] min-h-0',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

const VARIANT = {
  primary:
    'theme-accent-fill theme-on-accent shadow-elev-sm shadow-elev-inner-hl ' +
    'hover:-translate-y-px hover:shadow-elev-md',
  secondary:
    'theme-card theme-text border theme-border shadow-elev-sm ' +
    'hover:-translate-y-px hover:border-[var(--accent)] hover:theme-accent-text',
  ghost:
    'bg-transparent theme-text-muted hover:theme-bg-subtle hover:theme-text',
  danger:
    'bg-[color:var(--danger)] text-white shadow-elev-sm shadow-elev-inner-hl ' +
    'hover:-translate-y-px hover:shadow-elev-md hover:brightness-110',
}

function Spinner({ size }) {
  const s = size === 'sm' ? 14 : size === 'lg' ? 20 : 16
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    as: Component = 'button',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const classes = [
    BASE,
    SIZE[size] || SIZE.md,
    VARIANT[variant] || VARIANT.primary,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ')

  const isDisabled = disabled || loading

  // Only buttons should have a `type` attribute; if we're rendering an <a>,
  // drop `type` and let the link behave naturally.
  const elementProps = Component === 'button' ? { type, disabled: isDisabled } : { 'aria-disabled': isDisabled || undefined }

  return (
    <Component ref={ref} className={classes} {...elementProps} {...rest}>
      {loading ? (
        <Spinner size={size} />
      ) : leadingIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">{leadingIcon}</span>
      ) : null}
      {children ? <span className="inline-flex items-center">{children}</span> : null}
      {!loading && trailingIcon ? (
        <span className="inline-flex shrink-0" aria-hidden="true">{trailingIcon}</span>
      ) : null}
    </Component>
  )
})

export default Button
