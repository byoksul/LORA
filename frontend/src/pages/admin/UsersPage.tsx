import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.getUsers()).data || [],
  })

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await api.createUser({
      email: form.get('email') as string,
      password: form.get('password') as string,
      firstName: form.get('firstName') as string,
      lastName: form.get('lastName') as string,
      role: form.get('role') as string,
    })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    setShowForm(false)
  }

  const handleToggleActive = async (id: string, user: NonNullable<typeof users>[0]) => {
    await api.updateUser(id, {
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: !user.isActive,
    })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kullanıcı Yönetimi</h1>
          <p className="text-muted text-sm mt-1">Kullanıcı oluştur ve rol ata</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Yeni Kullanıcı
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 animate-fade-in">
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Input name="firstName" placeholder="Ad" required />
            <Input name="lastName" placeholder="Soyad" required />
            <Input name="email" type="email" placeholder="E-posta" required />
            <Input name="password" type="password" placeholder="Şifre" required />
            <select name="role" className="px-4 py-3 rounded-xl bg-card border border-border text-text" required>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Barista">Barista</option>
            </select>
            <div className="flex gap-2">
              <Button type="submit">Oluştur</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {users?.map((user) => (
          <Card key={user.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                <Badge variant={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
                <Badge>{user.role}</Badge>
              </div>
              <p className="text-sm text-muted">{user.email}</p>
              {user.lastLoginDate && (
                <p className="text-xs text-muted mt-1">
                  Son giriş: {new Date(user.lastLoginDate).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
            <Button
              variant={user.isActive ? 'danger' : 'success'}
              size="sm"
              onClick={() => handleToggleActive(user.id, user)}
            >
              {user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
