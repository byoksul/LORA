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
  priceLarge?: number | null
  supportsMilkChoice: boolean
  imageUrl?: string
  isActive: boolean
  trackStock: boolean
  hasActiveRecipe: boolean
  categoryId: string
  categoryName: string
}

export interface OrderItem {
  id?: string
  productId: string
  productName: string
  sizeLabel?: string | null
  milkType?: string | null
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
  subtotalAmount: number
  discountAmount: number
  discountType: DiscountType | string
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

export interface StockMovement {
  id: string
  stockItemId: string
  stockItemName: string
  unit: string
  movementType: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  referenceType?: string | null
  referenceId?: string | null
  notes?: string | null
  createdByName?: string | null
  createdDate: string
}

export interface ProductRecipe {
  id: string
  productId: string
  name: string
  isActive: boolean
  items: ProductRecipeItem[]
  createdDate: string
  updatedDate: string
}

export interface ProductRecipeItem {
  id: string
  stockItemId: string
  stockItemName: string
  quantity: number
  unit: string
  isOptional: boolean
}

export interface StockAlert {
  stockItemId: string
  name: string
  unit: string
  currentQuantity: number
  criticalLevel: number
  isCritical: boolean
}

export interface StockForecast {
  stockItemId: string
  name: string
  unit: string
  currentQuantity: number
  dailyAverageUsage?: number | null
  remainingDays?: number | null
  hasEnoughData: boolean
  message: string
}

export interface StockConsumption {
  stockItemId: string
  name: string
  unit: string
  totalQuantity: number
}

export interface StockDashboard {
  criticalStockCount: number
  todaySaleOutCount: number
  todayWasteQuantity: number
  topConsumedItems: StockConsumption[]
  expiringSoon: StockForecast[]
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
  stockSummary?: StockDashboard | null
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
export type DiscountType = 'None' | 'Student' | 'HealthcareWorker'
export type ProductSize = 'Küçük' | 'Büyük'
export type MilkType = 'Regular' | 'LactoseFree'

export const WASTE_REASONS = [
  'Döküldü',
  'Bozuldu',
  'Hatalı hazırlama',
  'Son kullanma',
  'Diğer',
] as const

export const STOCK_MOVEMENT_TYPES = [
  'PurchaseIn',
  'ManualIn',
  'ManualOut',
  'SaleOut',
  'WasteOut',
  'Adjustment',
  'ReturnIn',
  'CancelReturn',
] as const
