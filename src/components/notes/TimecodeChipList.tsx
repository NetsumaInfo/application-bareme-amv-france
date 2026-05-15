import type { ParsedTimecode } from '@/utils/timecodes'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { useI18n } from '@/i18n'

interface TimecodeChipListProps {
  items: ParsedTimecode[]
  color?: string
  onSelect: (item: ParsedTimecode) => void
}

export default function TimecodeChipList({ items, color = '#60a5fa', onSelect }: TimecodeChipListProps) {
  const { t } = useI18n()
  if (items.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-[9px] uppercase tracking-wider text-gray-500">{t('Timecodes :')}</span>
      {items.map((item) => (
        <HoverTextTooltip
          key={`${item.index}-${item.raw}`}
          text={t('Aller à {timecode}', { timecode: item.raw })}
          placement="above"
        >
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors"
            style={{
              borderColor: `${color}66`,
              color,
              backgroundColor: `${color}1A`,
            }}
          >
            {item.raw}
          </button>
        </HoverTextTooltip>
      ))}
    </div>
  )
}
