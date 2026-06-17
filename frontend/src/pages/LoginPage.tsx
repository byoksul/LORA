import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/Logo'
import { PinKeypad } from '@/components/PinKeypad'
import { FullscreenButton } from '@/components/FullscreenButton'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const doLogin = async (user: string, password: string) => {
    if (!user.trim() || password.length < 6) return
    setLoading(true)
    setError('')

    const result = await api.login(user.trim(), password)
    if (result.success && result.data) {
      setAuth(result.data.token, result.data.user)
      const role = result.data.user.role
      if (role === 'Cashier') navigate('/pos')
      else if (role === 'Barista') navigate('/bar')
      else if (role === 'Manager') navigate('/admin/products')
      else navigate('/admin')
    } else {
      setError(result.message || 'Giriş başarısız')
      setPin('')
    }
    setLoading(false)
  }

  const handlePinComplete = (completedPin: string) => {
    if (username.trim()) doLogin(username, completedPin)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4">
        <FullscreenButton />
      </div>

      <Card className="w-full max-w-md p-8 animate-fade-in shadow-soft">
        <div className="flex flex-col items-center mb-10">
          <Logo variant="login" className="mb-8" />
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted mb-2 block">Kullanıcı adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="kullanıcı adınız"
              autoComplete="username"
              className="w-full px-4 py-4 rounded-2xl bg-surface border border-border text-text text-lg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
            />
          </div>

          <div>
            <p className="text-sm text-muted mb-4 text-center">6 haneli şifrenizi girin</p>
            <PinKeypad
              value={pin}
              onChange={setPin}
              onComplete={handlePinComplete}
              disabled={loading || !username.trim()}
            />
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg text-center">{error}</p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={loading || !username.trim() || pin.length < 6}
            onClick={() => doLogin(username, pin)}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
