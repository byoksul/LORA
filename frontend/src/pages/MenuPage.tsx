import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductImage } from '@/components/ProductImage'
import { ProductPriceDisplay } from '@/components/ProductPriceDisplay'
import { Logo } from '@/components/Logo'
import { FullscreenButton } from '@/components/FullscreenButton'
import { api } from '@/lib/api'
import { DISCOUNT_PERCENT } from '@/lib/utils'
import type { Product } from '@/types'

function MenuProductCard({ product }: { product: Product }) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-card border border-border animate-fade-in shadow-card">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface shrink-0 border border-border">
        <ProductImage name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[15px] sm:text-base text-text leading-snug tracking-tight">
          {product.name}
        </h3>
        <div className="mt-1.5">
          <ProductPriceDisplay
            price={product.price}
            priceLarge={product.priceLarge}
            variant="menu"
            align="start"
          />
        </div>
        {product.description && (
          <p className="text-muted text-xs mt-1.5 line-clamp-2">{product.description}</p>
        )}
      </div>
    </div>
  )
}

export function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.getCategories()
      return res.data || []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['menuProducts', selectedCategory],
    queryFn: async () => {
      const res = await api.getProducts(selectedCategory || undefined)
      return res.data || []
    },
  })

  const groupedProducts = useMemo(() => {
    if (selectedCategory || !categories?.length || !products?.length) return null

    const byCategory = new Map<string, Product[]>()
    for (const product of products) {
      const list = byCategory.get(product.categoryId) ?? []
      list.push(product)
      byCategory.set(product.categoryId, list)
    }

    return [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        category,
        products: byCategory.get(category.id) ?? [],
      }))
      .filter((group) => group.products.length > 0)
  }, [selectedCategory, categories, products])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-center">
          <Logo variant="menu" />
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2 flex justify-end">
          <FullscreenButton className="border-0 bg-transparent hover:bg-surface p-2" />
        </div>

        <div className="max-w-lg mx-auto px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[40px] shrink-0 ${
              !selectedCategory ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text'
            }`}
          >
            Tümü
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[40px] shrink-0 ${
                selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <p className="text-center text-xs text-muted bg-success/8 border border-success/20 rounded-2xl px-4 py-3 leading-relaxed">
          Öğrenci ve sağlık çalışanlarına kasada %{DISCOUNT_PERCENT} indirim uygulanmaktadır.
        </p>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {groupedProducts ? (
          <div className="space-y-8">
            {groupedProducts.map(({ category, products: categoryProducts }) => (
              <section key={category.id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
                    {category.name}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {categoryProducts.map((product) => (
                    <MenuProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products?.map((product) => (
              <MenuProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-lg mx-auto px-4 py-8 text-center text-xs text-muted">
        LORA Coffee Company © 2024
      </footer>
    </div>
  )
}
