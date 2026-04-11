/**
 * StatusBadge — shows the content workflow status as a coloured pill.
 * Statuses: draft | pending | published | rejected
 */
export default function StatusBadge({ status }) {
  const map = {
    draft:     { cls: 'bg-gray-100 text-gray-600',    label: '📝 Draft'          },
    pending:   { cls: 'bg-yellow-100 text-yellow-700', label: '⏳ Pending Review' },
    published: { cls: 'bg-green-100 text-green-700',  label: '✅ Published'       },
    rejected:  { cls: 'bg-red-100 text-red-600',      label: '❌ Rejected'        },
  }
  const { cls, label } = map[status] ?? { cls: 'bg-gray-100 text-gray-500', label: status ?? '—' }
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}
