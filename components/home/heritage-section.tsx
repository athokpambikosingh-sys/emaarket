import Image from 'next/image'

const pillars = [
  {
    title: 'Mayek Naibi',
    text: 'The striped Phanek border whose name references the Meitei script — worn by women across generations.',
  },
  {
    title: 'Moirang Phee',
    text: 'A temple-tooth motif from Moirang, once woven only for royal and ceremonial occasions.',
  },
  {
    title: 'Longpi Hampai',
    text: 'Black stone pottery hand-shaped without a wheel by the Tangkhul Naga potters of Ukhrul.',
  },
]

export function HeritageSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-square">
        <Image
          src="/images/heritage.png"
          alt="Close-up of a maroon, cream and gold handwoven Manipuri textile with temple motifs"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-maroon-deep/90 to-transparent p-6">
          <p className="font-serif text-2xl italic text-primary-foreground">
            &ldquo;Every motif is a word in a language our grandmothers spoke with thread.&rdquo;
          </p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Cultural heritage</p>
        <h2 className="mt-2 text-balance text-4xl font-semibold leading-tight md:text-5xl">
          From Ima Keithel to your home
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          For over 500 years, the women of Imphal have run Ima Keithel — the Mothers&apos; Market — selling
          textiles and crafts they made themselves. Emaarket carries that spirit online, so a weaver in
          Wangkhei can sell to a buyer in Mumbai without losing her margin to middlemen.
        </p>
        <ul className="mt-8 flex flex-col gap-5">
          {pillars.map((p, i) => (
            <li key={p.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold font-serif text-lg font-semibold text-gold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-sans text-base font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
