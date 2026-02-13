import type { ParsedTimecode } from '@/utils/timecodes'

interface TimecodeChipListProps {
  items: ParsedTimecode[]
  color?: string
  onSelect: (item: ParsedTimecode) => void
}

export default function TimecodeChipList({ items, color = '#60a5fa', onSelect }: TimecodeChipListProps) {
  if (items.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-[9px] uppercase tracking-wider text-gray-500">Timecodes:</span>
      {items.map((item) => (
        <button
          key={`${item.index}-${item.raw}`}
          type="button"
          onClick={() => onSelect(item)}
          className="px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors"
          style={{
            borderColor: `${color}66`,
            color,
            backgroundColor: `${color}1A`,
          }}
          title={`Aller à ${item.raw}`}
        >
          {item.raw}
        </button>
      ))}
    </div>
  )
}
