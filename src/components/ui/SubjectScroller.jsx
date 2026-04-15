const VARIANTS = {
  indigo: {
    active: 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-100',
    inactive: 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
    iconActive: 'bg-white/20 text-white',
    iconInactive: 'bg-gray-50 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
  },
  amber: {
    active: 'border-amber-500 bg-amber-600 text-white shadow-md shadow-amber-100',
    inactive: 'border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
    iconActive: 'bg-white/20 text-white',
    iconInactive: 'bg-gray-50 text-gray-600 group-hover:bg-amber-100 group-hover:text-amber-700',
  },
  purple: {
    active: 'border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-100',
    inactive: 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700',
    iconActive: 'bg-white/20 text-white',
    iconInactive: 'bg-gray-50 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700',
  },
}

export default function SubjectScroller({
  subjects,
  value,
  onChange,
  variant = 'indigo',
  allLabel = 'All Subjects',
  allIcon = '📚',
}) {
  const styles = VARIANTS[variant] ?? VARIANTS.indigo
  const items = [{ id: '', label: allLabel, icon: allIcon }, ...subjects]

  return (
    <div className="-mx-4 overflow-hidden">
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain px-4 pr-10 pb-1"
        aria-label="Filter by subject"
      >
        {items.map(subject => {
          const active = value === subject.id
          return (
            <button
              key={subject.id || 'all-subjects'}
              type="button"
              onClick={() => onChange(active ? '' : subject.id)}
              aria-pressed={active}
              className={`group flex w-36 shrink-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 min-h-0 ${
                active ? styles.active : styles.inactive
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
                  active ? styles.iconActive : styles.iconInactive
                }`}
                aria-hidden="true"
              >
                {subject.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black leading-tight">
                  {subject.label}
                </span>
                <span className={`mt-0.5 block text-xs font-bold ${active ? 'text-white/75' : 'text-gray-400'}`}>
                  {active ? 'Selected' : 'Tap to filter'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
