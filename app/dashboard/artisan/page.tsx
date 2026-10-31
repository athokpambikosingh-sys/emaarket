import type { Metadata } from 'next'
import { ArtisanDashboard } from '@/components/dashboard/artisan-dashboard'

export const metadata: Metadata = { title: 'Artisan dashboard' }

export default function ArtisanDashboardPage() {
  return <ArtisanDashboard />
}
