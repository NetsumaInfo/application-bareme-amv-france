import { X } from 'lucide-react'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface FloatingPlayerHeaderProps {
  isDragging: boolean
  isHovering: boolean
  title: string
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onClose: () => void
}

export function FloatingPlayerHeader({
  isDragging,
  isHovering,
  title,
  onMouseDown,
  onClose,
}: FloatingPlayerHeaderProps) {
  const { t } = useI18n()
  return (
    <div
      onMouseDown={onMouseDown}
      className={`flex items-center justify-between bg-linear-to-r from-gray-900 to-gray-800 px-3 py-1.5 cursor-move select-none ${
        isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
      }`}
      role="presentation"
    >
      <span className="text-[10px] font-medium text-gray-400">{title}</span>
      {isHovering && (
        <HoverTextTooltip text={t('Fermer')}>
          <button
            onClick={onClose}
            aria-label={t('Fermer')}
            className="flex items-center justify-center w-4 h-4 rounded-sm hover:bg-gray-700 transition-colors"
          >
            <X size={12} className="text-gray-400" />
          </button>
        </HoverTextTooltip>
      )}
    </div>
  )
}
