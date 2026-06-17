import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, ChefHat, Trash2 } from 'lucide-react'
import { ProductRecipePanel } from '@/components/ProductRecipePanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ProductImage } from '@/components/ProductImage'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Product, Category } from '@/types'

type ProductForm = {
  name: string
  description: string
  price: string
  imageUrl: string
  categoryId: string
  isActive: boolean
  trackStock: boolean
  useRecipe: boolean
  stockQuantity: string
}

const emptyProductForm = (categoryId?: string): ProductForm => ({
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  categoryId: categoryId || '',
  isActive: true,
  trackStock: false,
  useRecipe: false,
  stockQuantity: '0',
})

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm())
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null)

  const { data: products } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: async () => (await api.getProducts(undefined, true)).data || [],
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: async () => (await api.getCategories(true)).data || [],
  })

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: String(editingProduct.price),
        imageUrl: editingProduct.imageUrl || '',
        categoryId: editingProduct.categoryId,
        isActive: editingProduct.isActive,
        trackStock: editingProduct.trackStock,
        useRecipe: editingProduct.hasActiveRecipe,
        stockQuantity: String(editingProduct.stockQuantity ?? 0),
      })
    } else if (showForm && tab === 'products') {
      setProductForm(emptyProductForm(categories?.[0]?.id))
    }
  }, [editingProduct, showForm, tab, categories])

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = {
      name: productForm.name,
      description: productForm.description || undefined,
      price: parseFloat(productForm.price),
      imageUrl: productForm.imageUrl.trim() || undefined,
      isActive: productForm.isActive,
      trackStock: productForm.trackStock,
      stockQuantity: productForm.trackStock ? parseFloat(productForm.stockQuantity) || 0 : 0,
      categoryId: productForm.categoryId,
    }

    if (editingProduct) {
      await api.updateProduct(editingProduct.id, data)
    } else {
      await api.createProduct(data)
    }

    queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['menuProducts'] })
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string,
      imageUrl: form.get('imageUrl') as string,
      sortOrder: parseInt(form.get('sortOrder') as string) || 0,
      isActive: form.get('isActive') === 'on',
    }

    if (editingCategory) {
      await api.updateCategory(editingCategory.id, data)
    } else {
      await api.createCategory(data)
    }

    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories', 'admin'] })
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return
    const res = await api.deleteProduct(product.id)
    if (!res.success) {
      window.alert(res.message || 'Ürün silinemedi.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['menuProducts'] })
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) return
    const res = await api.deleteCategory(category.id)
    if (!res.success) {
      window.alert(res.message || 'Kategori silinemedi.')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['categories', 'admin'] })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Ürün Yönetimi</h1>
          <p className="text-muted text-sm mt-1">Veritabanındaki ürün ve kategorileri yönetin</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true)
            setEditingProduct(null)
            setEditingCategory(null)
          }}
        >
          <Plus className="w-4 h-4" />
          Yeni Ekle
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
            tab === 'products' ? 'bg-primary text-white' : 'bg-card text-muted hover:text-text'
          }`}
        >
          Ürünler
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${
            tab === 'categories' ? 'bg-primary text-white' : 'bg-card text-muted hover:text-text'
          }`}
        >
          Kategoriler
        </button>
      </div>

      {showForm && (
        <Card className="p-6 animate-fade-in">
          {tab === 'products' ? (
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Ürün adı</label>
                  <Input
                    value={productForm.name}
                    onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ürün adı"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Fiyat (₺)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted mb-1.5 block">Açıklama</label>
                  <Input
                    value={productForm.description}
                    onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Kısa açıklama"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted mb-1.5 block">Görsel URL</label>
                  <Input
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-muted mt-1.5">
                    Harici görsel bağlantısı. Boş bırakırsanız LORA placeholder gösterilir.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted mb-2 block">Önizleme</label>
                  <div className="flex gap-4 items-start">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border shrink-0">
                      <ProductImage
                        name={productForm.name || 'Ürün'}
                        imageUrl={productForm.imageUrl}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="text-xs text-muted space-y-1 pt-2">
                      <p>POS, QR menü ve admin listesinde bu görsel kullanılır.</p>
                      <p>URL kaydedildikten sonra build gerekmez.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Kategori</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-6 items-center pt-2">
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Aktif
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={productForm.trackStock}
                      onChange={(e) => setProductForm((f) => ({
                        ...f,
                        trackStock: e.target.checked,
                        useRecipe: e.target.checked ? f.useRecipe : false,
                      }))}
                    />
                    Stok Takibi
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={productForm.useRecipe}
                      onChange={(e) => setProductForm((f) => ({
                        ...f,
                        useRecipe: e.target.checked,
                        trackStock: e.target.checked ? true : f.trackStock,
                      }))}
                    />
                    Hammadde reçetesi (kahve)
                  </label>
                </div>
                {productForm.trackStock && !productForm.useRecipe && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted mb-1.5 block">Stok adedi</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                      placeholder="Örn. 10"
                      required
                    />
                    <p className="text-xs text-muted mt-1.5">
                      Hazır ürünler için (Haşhaşlı, sandviç). Her satışta 1 adet düşer.
                    </p>
                  </div>
                )}
                {productForm.trackStock && productForm.useRecipe && (
                  <div className="md:col-span-2 px-4 py-3 rounded-xl bg-background border border-border text-sm text-muted">
                    Kahve gibi hammadde tüketen ürünler: kaydettikten sonra listedeki şef şapkasından reçete tanımlayın.
                    Stok adedi alanı kullanılmaz; süt, çekirdek vb. Stok Yönetimi&apos;nden takip edilir.
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">Kaydet</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveCategory} className="grid md:grid-cols-2 gap-4">
              <Input name="name" placeholder="Kategori adı" value={editingCategory?.name || ''} required />
              <Input name="sortOrder" type="number" placeholder="Sıra" value={editingCategory?.sortOrder || ''} />
              <Input name="description" placeholder="Açıklama" value={editingCategory?.description || ''} />
              <Input name="imageUrl" placeholder="Görsel URL" value={editingCategory?.imageUrl || ''} />
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" name="isActive" defaultChecked={editingCategory?.isActive ?? true} />
                Aktif
              </label>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Kaydet</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {tab === 'products' ? (
        <div className="grid gap-3">
          {products?.map((product) => (
            <Card key={product.id} className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
                <ProductImage
                  name={product.name}
                  imageUrl={product.imageUrl}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text">{product.name}</h3>
                  <Badge variant={product.isActive ? 'success' : 'danger'}>
                    {product.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                  {product.trackStock && (
                    product.hasActiveRecipe ? (
                      <Badge variant={product.hasActiveRecipe ? 'success' : 'warning'}>
                        Reçete tanımlı
                      </Badge>
                    ) : (
                      <Badge variant={product.stockQuantity <= 2 ? 'warning' : 'success'}>
                        Stok: {product.stockQuantity} adet
                      </Badge>
                    )
                  )}
                </div>
                <p className="text-sm text-muted">{product.categoryName} · {formatCurrency(product.price)}</p>
                {product.imageUrl && (
                  <p className="text-xs text-muted/70 truncate mt-0.5">{product.imageUrl}</p>
                )}
              </div>
              <button
                onClick={() => setRecipeProduct(product)}
                className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-muted hover:text-primary"
                title="Hammadde reçetesi"
              >
                <ChefHat className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setEditingProduct(product); setShowForm(true); setTab('products') }}
                className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-muted hover:text-text"
                title="Düzenle"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteProduct(product)}
                className="p-2 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer text-muted hover:text-danger"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {categories?.map((cat) => (
            <Card key={cat.id} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text">{cat.name}</h3>
                  <Badge variant={cat.isActive ? 'success' : 'danger'}>
                    {cat.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <p className="text-sm text-muted">Sıra: {cat.sortOrder}</p>
              </div>
              <button
                onClick={() => { setEditingCategory(cat); setShowForm(true); setTab('categories') }}
                className="p-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer text-muted hover:text-text"
                title="Düzenle"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat)}
                className="p-2 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer text-muted hover:text-danger"
                title="Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
      {recipeProduct && (
        <ProductRecipePanel product={recipeProduct} onClose={() => setRecipeProduct(null)} />
      )}
    </div>
  )
}
