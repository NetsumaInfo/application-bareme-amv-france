import { Users } from 'lucide-react'
import type { ResultatsHeaderProps } from '@/components/interfaces/resultats/types'
import { ColorSwatchPicker } from '@/components/ui/ColorSwatchPicker'
import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'
import { COLOR_MEMORY_KEYS } from '@/utils/colorPickerStorage'
import { withAlpha } from '@/utils/colors'
import { useI18n } from '@/i18n'

export function ResultatsHeader({
  judges,
  selectedJudgeKey,
  judgeColors,
  onSelectJudge,
  onJudgeColorChange,
  onOpenMemberContextMenu,
}: ResultatsHeaderProps) {
  const { t } = useI18n()

  const seenNames = new Map<string, number>()
  const getDisplayName = (name: string, isCurrentJudge: boolean) => {
    const normalized = name.trim() || t('Juge')
    const count = seenNames.get(normalized) ?? 0
    seenNames.set(normalized, count + 1)
    if (isCurrentJudge) return `${normalized} (${t('projet')})`
    if (count === 0) return normalized
    return `${normalized} (${count + 1})`
  }

  return (
    <div className="ml-auto flex min-w-0 items-start justify-end gap-2">
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
        <div className="flex items-center gap-1.5 px-1 text-[10px] text-gray-500">
          <Users size={13} />
          {t('{count} juge(s)', { count: judges.length })}
        </div>

        {judges.map((judge) => {
          const color = judgeColors[judge.key] ?? '#60a5fa'
          const active = selectedJudgeKey === judge.key
          const displayName = getDisplayName(judge.judgeName, judge.isCurrentJudge)

          return (
            <div key={judge.key} className="inline-flex items-center gap-1.5">
              <HoverTextTooltip text={t('Clic droit pour options')}>
                <button
                  type="button"
                  onClick={() => onSelectJudge(judge.key)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onOpenMemberContextMenu(judge.key, event.clientX, event.clientY)
                  }}
                  className="inline-flex h-6 items-center rounded-md px-1.5 text-[11px] transition-colors hover:bg-white/5 hover:text-white"
                  style={{
                    color: active ? color : 'rgb(var(--app-text) / 0.78)',
                    backgroundColor: active ? withAlpha(color, 0.12) : 'transparent',
                    boxShadow: active ? `inset 0 -1px 0 0 ${withAlpha(color, 0.9)}` : 'none',
                  }}
                >
                  {displayName}
                </button>
              </HoverTextTooltip>
              <ColorSwatchPicker
                value={color}
                onChange={(next) => onJudgeColorChange(judge.key, next)}
                title={t('Couleur de {name}', { name: displayName })}
                triggerSize="sm"
                triggerVariant="dot"
                memoryKey={COLOR_MEMORY_KEYS.recentJudgeColors}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
