import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { useNotationStore } from '@/store/useNotationStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'

export function BaremeSelector() {
  const { currentBareme, availableBaremes, setBareme } = useNotationStore()
  const { updateProject, updateSettings } = useProjectStore()
  const { setShowBaremeEditor } = useUIStore()
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors border border-gray-700/50"
      >
        <span className="max-w-[100px] truncate">{currentBareme?.name || 'Barème'}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute top-full right-0 mt-1 w-56 bg-surface border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          {availableBaremes.map((bareme) => (
            <button
              key={bareme.id}
              onClick={() => handleSelectBareme(bareme)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-light transition-colors ${
                bareme.id === currentBareme?.id
                  ? 'text-primary-400 bg-primary-600/10'
                  : 'text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium">{bareme.name}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {bareme.criteria.length} critères — {bareme.totalPoints} pts
              </div>
            </button>
          ))}

          <div className="border-t border-gray-700 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
                window.dispatchEvent(new CustomEvent('amv:bareme-open-list'))
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-light transition-colors flex items-center gap-2"
            >
              <Pencil size={11} />
              Gérer les barèmes
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setShowBaremeEditor(true)
                window.dispatchEvent(new CustomEvent('amv:bareme-open-create'))
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-primary-400 hover:text-primary-300 hover:bg-surface-light transition-colors flex items-center gap-2"
            >
              <Plus size={11} />
              Créer un barème
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
