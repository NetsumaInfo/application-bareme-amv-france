import { useEffect, useState, type ReactNode } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { useI18n } from '@/i18n'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

async function currentWindow() {
  const m = await import('@tauri-apps/api/window')
  return m.getCurrentWindow()
}

/**
 * Custom caption buttons (minimize / maximize-restore / close) for frameless
 * windows. Marked `data-no-drag` so the window-drag handler ignores them.
 */
export function WindowControls({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const [maxed, setMaxed] = useState(false)

  useEffect(() => {
    if (!isTauri) return
    let unlisten: (() => void) | undefined
    void (async () => {
      const w = await currentWindow()
      setMaxed(await w.isMaximized())
      unlisten = await w.onResized(async () => setMaxed(await w.isMaximized()))
    })()
    return () => unlisten?.()
  }, [])

  if (!isTauri) return null

  const btn =
    'inline-flex h-[26px] w-10 items-center justify-center text-gray-400 transition-colors hover:bg-surface-light hover:text-white [&_svg]:size-3'

  return (
    <div className={`flex items-center ${className}`} data-no-drag>
      <HoverlessButton label={t('Réduire')} className={btn} onClick={() => void currentWindow().then((w) => w.minimize())}>
        <Minus />
      </HoverlessButton>
      <HoverlessButton
        label={maxed ? t('Restaurer') : t('Agrandir')}
        className={btn}
        onClick={() => void currentWindow().then((w) => w.toggleMaximize())}
      >
        {maxed ? <Copy className="-scale-x-100" /> : <Square />}
      </HoverlessButton>
      <HoverlessButton
        label={t('Fermer la fenêtre')}
        className={`${btn} hover:bg-red-600 hover:text-white`}
        onClick={() => void currentWindow().then((w) => w.close())}
      >
        <X />
      </HoverlessButton>
    </div>
  )
}

function HoverlessButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string
  className: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <HoverTextTooltip text={label}>
      <button type="button" aria-label={label} className={className} onClick={onClick}>
        {children}
      </button>
    </HoverTextTooltip>
  )
}
