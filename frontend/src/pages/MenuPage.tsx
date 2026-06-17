import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductImage } from '@/components/ProductImage'
import { Logo } from '@/components/Logo'
import { FullscreenButton } from '@/components/FullscreenButton'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-center">
          <Logo variant="menu" />
        </div>
        <div className="max-w-lg mx-auto px-4 pb-2 flex justify-end">
          <FullscreenButton className="border-0 bg-transparent hover:bg-surface p-2" />
        </div>

        <div className="max-w-lg mx-auto px-4 pb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[40px] ${
              !selectedCategory ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text'
            }`}
          >
            Tümü
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer min-h-[40px] ${
                selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-surface text-muted hover:text-text'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {products?.map((product) => (
          <div
            key={product.id}
            className="flex gap-4 p-5 rounded-2xl bg-card border border-border animate-fade-in shadow-card"
          >
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface shrink-0 border border-border">
              <ProductImage
                name={product.name}
                imageUrl={product.imageUrl}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium text-text">{product.name}</h3>
                <span className="text-primary font-semibold shrink-0">
                  {formatCurrency(product.price)}
                </span>
              </div>
              {product.description && (
                <p className="text-muted text-sm mt-1 line-clamp-2">{product.description}</p>
              )}
            </div>
          </div>
        ))}
      </main>

      <footer className="max-w-lg mx-auto px-4 py-8 text-center text-xs text-muted">
        LORA Coffee Company © 2024
      </footer>
    </div>
  )
}
