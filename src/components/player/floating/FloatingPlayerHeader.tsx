import { X } from 'lucide-react'

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
  return (
    <div
      onMouseDown={onMouseDown}
      className={`flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-1.5 cursor-move select-none ${
        isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
      }`}
    >
      <span className="text-[10px] font-medium text-gray-400">{title}</span>
      {isHovering && (
        <button
          onClick={onClose}
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-700 transition-colors"
          title="Fermer"
        >
          <X size={12} className="text-gray-400" />
        </button>
      )}
    </div>
  )
}
