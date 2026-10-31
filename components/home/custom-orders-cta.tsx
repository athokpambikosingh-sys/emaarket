import Link from 'next/link'
import { Handshake, MessagesSquare, Package, Truck } from 'lucide-react'
import { buttonClass, SectionHeading } from '../shared'

const steps = [
  { icon: MessagesSquare, title: 'Chat directly', text: 'Ask questions, share references and negotiate with the maker.' },
  { icon: Handshake, title: 'Agree a fair price', text: 'Send offers in chat — artisans set the final price, always.' },
  { icon: Package, title: 'Made to order', text: 'Custom colours, sizes and labels for weddings, gifting and retail.' },
  { icon: Truck, title: 'Shipped with care', text: 'Packed by the artisan and tracked to your door across India.' },
]

export function CustomOrdersCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 md:px-6">
      <SectionHeading
        align="center"
        eyebrow="Custom & bulk orders"
        title="Work with artisans, not catalogues"
        description="Ordering 20 shawls for a wedding, or 200 pots for your café? Send one request and artisans will reply with quotes."
      />
      <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <s.icon className="size-6 text-primary" aria-hidden="true" />
              <span className="font-serif text-3xl text-gold/60">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-sans text-base font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/bulk-orders" className={buttonClass.primary}>
          Request a bulk quote
        </Link>
        <Link href="/messages" className={buttonClass.outline}>
          Start a conversation
        </Link>
      </div>
    </section>
  )
}
