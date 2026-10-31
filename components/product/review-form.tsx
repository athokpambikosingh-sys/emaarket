'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { buttonClass, inputClass } from '../shared'

export function ReviewForm({ productId }: { productId: string }) {
  const { submitReview } = useStore()
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    await submitReview(productId, Number(form.get('rating')), String(form.get('title')), String(form.get('body')))
    setBusy(false)
    formElement.reset()
  }
  return <form onSubmit={submit} className="mt-6 grid max-w-2xl gap-3 rounded-xl border border-border bg-card p-5">
    <h3 className="font-serif text-2xl font-semibold">Share your review</h3>
    <label className="grid gap-1 text-sm">Rating<select name="rating" required className={inputClass}><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></label>
    <label className="grid gap-1 text-sm">Title<input name="title" maxLength={160} className={inputClass} /></label>
    <label className="grid gap-1 text-sm">Your review<textarea name="body" maxLength={5000} rows={4} className={inputClass} /></label>
    <button disabled={busy} className={`${buttonClass.primary} justify-self-start`}>{busy ? 'Submitting…' : 'Submit review'}</button>
  </form>
}
