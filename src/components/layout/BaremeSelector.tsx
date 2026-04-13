import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Settings2 } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

export function BaremeSelector() {
  const { currentBareme, availableBaremes, setBareme } = useNotationStore()
  const { updateProject, updateSettings } = useProjectStore()
  const { setShowBaremeEditor } = useUIStore()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelectBareme = (bareme: typeof currentBareme) => {
    if (!bareme) return
    setBareme(bareme)
    updateProject({ baremeId: bareme.id })
    updateSettings({ hideFinalScoreUntilEnd: Boolean(bareme.hideTotalsUntilAllScored) })
    setOpen(false)
  }

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <HoverTextTooltip text={t('Barème')}>
        <button
          onClick={() => setOpen((value) => !value)}
          aria-label={t('Barème')}
          data-open={open ? 'true' : 'false'}
          className="app-header-trigger gap-0.5"
        >
          <span className="inline-flex items-center gap-0.5 leading-none">
            <span className="max-w-[150px] truncate font-medium leading-none">{currentBareme?.name || t('Barème')}</span>
            <ChevronDown
              size={10}
              className={`app-header-trigger-chevron shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </HoverTextTooltip>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-[12px] border border-gray-700 bg-surface shadow-xl">
          <div className="py-1.5">
            {availableBaremes.map((bareme) => {
              const isSelected = bareme.id === currentBareme?.id

              return (
                <button
                  key={bareme.id}
                  onClick={() => handleSelectBareme(bareme)}
                  className={`relative flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-surface-light text-white'
                      : 'text-gray-300 hover:bg-surface-light'
                  }`}
                >
                  <span
                    className={`absolute inset-y-1 left-0 w-[2px] rounded-r ${
                      isSelected ? 'bg-primary-500' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 pl-1">
                    <div className="truncate font-medium">{bareme.name}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {t('{count} critères — {points} pts', { count: bareme.criteria.length, points: bareme.totalPoints })}
                    </div>
                  </div>
                  <div className="mt-[1px] shrink-0 text-[11px] text-gray-500">
                    {bareme.totalPoints} pts
                  </div>
                </button>
              )
            })}
          </div>

          <div className="border-t border-gray-700 py-1.5">
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
                window.dispatchEvent(new CustomEvent('amv:bareme-open-list'))
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-400 transition-colors hover:bg-surface-light hover:text-white"
            >
              <Settings2 size={12} />
              {t('Gérer les barèmes')}
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
                window.dispatchEvent(new CustomEvent('amv:bareme-open-create'))
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-primary-300 transition-colors hover:bg-surface-light hover:text-primary-200"
            >
              <Plus size={11} />
              {t('Créer un barème')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
