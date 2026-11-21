import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  action?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'items-center text-center md:flex-col md:items-center',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-balance text-4xl font-semibold leading-tight text-foreground md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Rating({ value, reviews, className }: { value: number; reviews?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
      <span className="font-medium">{value > 0 ? value.toFixed(1) : 'New'}</span>
      {reviews !== undefined && reviews > 0 && (
        <span className="text-muted-foreground">({reviews})</span>
      )}
      <span className="sr-only">{`Rated ${value} out of 5`}</span>
    </div>
  )
}

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode
  tone?: 'default' | 'gold' | 'maroon' | 'success' | 'muted'
  className?: string
}) {
  const tones = {
    default: 'bg-secondary text-secondary-foreground',
    gold: 'bg-gold/15 text-[#7a5520]',
    maroon: 'bg-primary text-primary-foreground',
    success: 'bg-emerald-50 text-emerald-800',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="border-b border-transparent bg-secondary pattern-weave">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>}
        <h1 className="mt-2 text-balance text-4xl font-semibold text-foreground md:text-6xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

export const buttonClass = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-maroon-deep disabled:pointer-events-none disabled:opacity-50',
  outline:
    'inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-transparent px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50',
  gold:
    'inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-gold-foreground transition-colors hover:bg-[#a37630] disabled:pointer-events-none disabled:opacity-50',
}

export const inputClass =
  'h-11 w-full rounded-md border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-gold focus:ring-2 focus:ring-gold/30'
