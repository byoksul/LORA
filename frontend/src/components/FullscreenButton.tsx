import { useEffect, useState } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FullscreenButton({ className }: { className?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Tarayıcı tam ekranı desteklemiyor olabilir
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'touch-target touch-pressable min-h-[48px] min-w-[48px] p-2.5 rounded-2xl border border-border bg-surface text-muted active:text-text active:bg-card-hover transition-colors cursor-pointer lg:hover:text-text lg:hover:bg-card-hover',
        className
      )}
      aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
    >
      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
    </button>
  )
}
