import type { ApiResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('lora_token')
}

function clearAuth() {
  localStorage.removeItem('lora_token')
  localStorage.removeItem('lora_user')
}

function redirectToLogin() {
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/menu')) {
    window.location.href = '/login'
  }
}

function mapErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage

  switch (status) {
    case 400:
      return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.'
    case 401:
      return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.'
    case 403:
      return 'Bu işlem için yetkiniz bulunmuyor.'
    case 404:
      return 'İstenen kayıt bulunamadı.'
    case 429:
      return 'Çok fazla deneme yaptınız. Lütfen bir süre bekleyin.'
    case 500:
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin.'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

    if (response.status === 401 || response.status === 403) {
      clearAuth()
      redirectToLogin()
      return { success: false, data: null, message: mapErrorMessage(response.status) }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({} as { message?: string }))
      return {
        success: false,
        data: null,
        message: mapErrorMessage(response.status, error.message),
      }
    }

    return response.json()
  } catch {
    return { success: false, data: null, message: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' }
  }
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: import('@/types').User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getCategories: () => request<import('@/types').Category[]>('/api/categories'),
  getProducts: (categoryId?: string) =>
    request<import('@/types').Product[]>(`/api/products${categoryId ? `?categoryId=${categoryId}` : ''}`),

  getActiveOrders: () => request<import('@/types').Order[]>('/api/orders/active'),
  createOrder: (data: unknown) =>
    request<import('@/types').Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) =>
    request<import('@/types').Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getDashboard: () => request<import('@/types').Dashboard>('/api/dashboard'),
  getStockItems: () => request<import('@/types').StockItem[]>('/api/stock-items'),
  getStockMovements: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<import('@/types').StockMovement[]>(`/api/stock/movements${qs}`)
  },
  getStockAlerts: () => request<import('@/types').StockAlert[]>('/api/stock/alerts'),
  getStockForecast: () => request<import('@/types').StockForecast[]>('/api/stock/forecast'),
  getStockDashboard: () => request<import('@/types').StockDashboard>('/api/stock/dashboard'),
  createStockItem: (data: unknown) =>
    request<import('@/types').StockItem>('/api/stock-items', { method: 'POST', body: JSON.stringify(data) }),
  updateStockItem: (id: string, data: unknown) =>
    request<import('@/types').StockItem>(`/api/stock-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  stockManualIn: (id: string, data: unknown) =>
    request<import('@/types').StockMovement>(`/api/stock-items/${id}/manual-in`, { method: 'POST', body: JSON.stringify(data) }),
  stockManualOut: (id: string, data: unknown) =>
    request<import('@/types').StockMovement>(`/api/stock-items/${id}/manual-out`, { method: 'POST', body: JSON.stringify(data) }),
  stockWaste: (id: string, data: unknown) =>
    request<import('@/types').StockMovement>(`/api/stock-items/${id}/waste`, { method: 'POST', body: JSON.stringify(data) }),
  stockAdjustment: (id: string, data: unknown) =>
    request<import('@/types').StockMovement>(`/api/stock-items/${id}/adjustment`, { method: 'POST', body: JSON.stringify(data) }),
  stockPurchase: (id: string, data: unknown) =>
    request<import('@/types').StockMovement>(`/api/stock-items/${id}/purchase`, { method: 'POST', body: JSON.stringify(data) }),
  createStockMovement: (data: unknown) =>
    request<unknown>('/api/stock/movements', { method: 'POST', body: JSON.stringify(data) }),

  getProductRecipe: (productId: string) =>
    request<import('@/types').ProductRecipe>(`/api/products/${productId}/recipe`),
  upsertProductRecipe: (productId: string, data: unknown) =>
    request<import('@/types').ProductRecipe>(`/api/products/${productId}/recipe`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecipeItem: (productId: string, itemId: string) =>
    request<import('@/types').ProductRecipe>(`/api/products/${productId}/recipe/items/${itemId}`, { method: 'DELETE' }),

  getUsers: () => request<import('@/types').User[]>('/api/users'),
  createUser: (data: unknown) =>
    request<import('@/types').User>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: unknown) =>
    request<import('@/types').User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createProduct: (data: unknown) =>
    request<import('@/types').Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: unknown) =>
    request<import('@/types').Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createCategory: (data: unknown) =>
    request<import('@/types').Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: unknown) =>
    request<import('@/types').Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getSalesReport: (start?: string, end?: string) =>
    request<import('@/types').SalesReport[]>(
      `/api/reports/sales${start ? `?startDate=${start}&endDate=${end}` : ''}`
    ),
  getProductSalesReport: (start?: string, end?: string) =>
    request<import('@/types').ProductSalesReport[]>(
      `/api/reports/products${start ? `?startDate=${start}&endDate=${end}` : ''}`
    ),
  getStaffSalesReport: (start?: string, end?: string) =>
    request<import('@/types').StaffSalesReport[]>(
      `/api/reports/staff${start ? `?startDate=${start}&endDate=${end}` : ''}`
    ),
}
