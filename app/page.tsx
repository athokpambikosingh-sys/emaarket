import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { PopularProducts } from '@/components/home/popular-products'
import { HeritageSection } from '@/components/home/heritage-section'
import { ArtisanStories } from '@/components/home/artisan-stories'
import { CustomOrdersCta } from '@/components/home/custom-orders-cta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <PopularProducts />
      <HeritageSection />
      <ArtisanStories />
      <CustomOrdersCta />
    </>
  )
}
