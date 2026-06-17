import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { PosPage } from '@/pages/PosPage'
import { BarPage } from '@/pages/BarPage'
import { MenuPage } from '@/pages/MenuPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { ProductsPage } from '@/pages/admin/ProductsPage'
import { StockPage } from '@/pages/admin/StockPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { UsersPage } from '@/pages/admin/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/menu" element={<MenuPage />} />

          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'Manager', 'Cashier']}>
                <PosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bar"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'Manager', 'Barista']}>
                <BarPage />
              </ProtectedRoute>
            }
          />
          <Route path="/kitchen" element={<Navigate to="/bar" replace />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['SuperAdmin', 'Manager']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={
              <ProtectedRoute roles={['SuperAdmin']}>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="products" element={<ProductsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['SuperAdmin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
