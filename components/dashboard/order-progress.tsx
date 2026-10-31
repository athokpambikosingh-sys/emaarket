import type { OrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '../shared'

export const ORDER_STEPS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered']

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === 'Delivered' ? 'success' : status === 'Shipped' ? 'gold' : status === 'Processing' ? 'default' : 'muted'
  return <Badge tone={tone}>{status}</Badge>
}

export function OrderProgress({ status }: { status: OrderStatus }) {
  const current = ORDER_STEPS.indexOf(status)
  return (
    <ol className="flex items-center" aria-label={`Order status: ${status}`}>
      {ORDER_STEPS.map((step, i) => (
        <li key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                'size-3 rounded-full border-2',
                i <= current ? 'border-primary bg-primary' : 'border-border bg-card',
              )}
              aria-hidden="true"
            />
            <span className={cn('text-[11px]', i <= current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {step}
            </span>
          </div>
          {i < ORDER_STEPS.length - 1 && (
            <span
              className={cn('mx-1 mb-5 h-0.5 flex-1', i < current ? 'bg-primary' : 'bg-border')}
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-4xl font-semibold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
