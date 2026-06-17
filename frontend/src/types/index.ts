export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLoginDate?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  sortOrder: number
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isActive: boolean
  trackStock: boolean
  categoryId: string
  categoryName: string
}

export interface OrderItem {
  id?: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Payment {
  id?: string
  paymentType: string
  amount: number
}

export interface Order {
  id: string
  orderNumber: number
  status: string
  totalAmount: number
  notes?: string
  createdDate: string
  readyAt?: string | null
  items: OrderItem[]
  payments: Payment[]
}

export interface StockItem {
  id: string
  name: string
  unit: string
  currentQuantity: number
  criticalLevel: number
  isActive: boolean
  isCritical: boolean
}

export interface Dashboard {
  dailyRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  orderCount: number
  averageBasket: number
  topProducts: TopProduct[]
  lowProducts: TopProduct[]
  hourlyTraffic: HourlyData[]
  paymentDistribution: PaymentDistribution
}

export interface TopProduct {
  productName: string
  quantity: number
  revenue: number
}

export interface HourlyData {
  hour: number
  orderCount: number
}

export interface PaymentDistribution {
  cardAmount: number
  cashAmount: number
  complimentaryAmount: number
}

export interface SalesReport {
  date: string
  orderCount: number
  totalRevenue: number
  averageBasket: number
}

export interface ProductSalesReport {
  productName: string
  quantity: number
  revenue: number
}

export interface StaffSalesReport {
  staffName: string
  orderCount: number
  totalRevenue: number
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled'
export type PaymentType = 'Card' | 'Cash' | 'Complimentary' | 'Mixed'
