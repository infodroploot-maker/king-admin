import { STATUS_CONFIG, type BookingStatus } from '@/lib/types'
export default function StatusBadge({ status, size = 'md' }: { status: BookingStatus; size?: 'sm' | 'md' }) {
  const c = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${c.bg} ${c.color} ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'}`}>
      {c.icon} {c.label}
    </span>
  )
}
