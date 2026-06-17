import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Boxes,
  FileBarChart,
  Users,
  LogOut,
  Coffee,
  Monitor,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { FullscreenButton } from '@/components/FullscreenButton'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true, roles: ['SuperAdmin'] },
  { to: '/admin/products', icon: Package, label: 'Ürünler', roles: ['SuperAdmin', 'Manager'] },
  { to: '/admin/stock', icon: Boxes, label: 'Stok', roles: ['SuperAdmin', 'Manager'] },
  { to: '/admin/reports', icon: FileBarChart, label: 'Raporlar', roles: ['SuperAdmin', 'Manager'] },
  { to: '/admin/users', icon: Users, label: 'Kullanıcılar', roles: ['SuperAdmin'] },
]

const quickLinks = [
  { to: '/pos', icon: Monitor, label: 'POS' },
  { to: '/bar', icon: Coffee, label: 'Bar' },
  { to: '/menu', icon: Package, label: 'Menü' },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="h-screen flex bg-background">
      <aside className="w-64 border-r border-border flex flex-col bg-surface">
        <div className="relative border-b border-border py-4 px-4 flex justify-center items-center min-h-[88px]">
          <Logo variant="sidebar" />
          <FullscreenButton className="absolute right-2 top-2 border-0 bg-transparent hover:bg-card/40 p-2" />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted hover:text-text hover:bg-surface'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-3 text-xs text-muted mb-2">Hızlı Erişim</p>
            {quickLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-muted hover:text-text hover:bg-surface transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
