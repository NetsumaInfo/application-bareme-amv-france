import { getTotalPoints } from '@/components/scoring/baremeEditorUtils'
import { AppCheckbox } from '@/components/ui/AppCheckbox'
import { useI18n } from '@/i18n'
import type { Criterion } from '@/types/bareme'

interface BaremeEditHeaderFieldsProps {
  readOnly: boolean
  name: string
  description: string
  criteria: Criterion[]
  hideTotalsUntilAllScored: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onHideTotalsChange: (value: boolean) => void
}

export function BaremeEditHeaderFields({
  readOnly,
  name,
  description,
  criteria,
  hideTotalsUntilAllScored,
  onNameChange,
  onDescriptionChange,
  onHideTotalsChange,
}: BaremeEditHeaderFieldsProps) {
  const { t } = useI18n()

  return (
    <>
      <div>
        <label htmlFor="bareme-name" className="mb-1 block text-xs font-medium text-gray-400">
          {t('Nom du barème')}
        </label>
        <input
          id="bareme-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t('Japan Expo 2025')}
          className="w-full rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-hidden"
          disabled={readOnly}
        />
      </div>

      <div>
        <label htmlFor="bareme-description" className="mb-1 block text-xs font-medium text-gray-400">
          {t('Description (optionnel)')}
        </label>
        <textarea
          id="bareme-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-700 bg-surface-dark px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-hidden"
          disabled={readOnly}
        />
      </div>

      <div className="rounded-xl border border-gray-700/70 bg-surface-dark/28 px-3 py-2.5">
        <span className="block text-[11px] font-medium text-gray-400">{t('Total calculé')}</span>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="amv-number-ui text-lg font-semibold text-white">
            {t('{count} points', { count: getTotalPoints(criteria) })}
          </span>
          <span className="amv-number-ui text-[11px] text-gray-500">
            {t('{count} critères', { count: criteria.length })}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-700/70 bg-surface-dark/28 px-3 py-2.5">
        <AppCheckbox
          checked={hideTotalsUntilAllScored}
          onChange={onHideTotalsChange}
          disabled={readOnly}
          label={t('Cacher totaux et résultats tant que tous les clips ne sont pas notés')}
          className="items-start gap-2 text-xs leading-snug"
        />
      </div>
    </>
  )
}
