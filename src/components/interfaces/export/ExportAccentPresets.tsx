import { HoverTextTooltip } from '@/components/ui/HoverTextTooltip'

interface ExportAccentPresetsProps {
  accent: string
  presets: string[]
  onChange: (accent: string) => void
}

export function ExportAccentPresets({ accent, presets, onChange }: ExportAccentPresetsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => (
        <HoverTextTooltip key={preset} text={preset} className="inline-flex">
          <button
            type="button"
            onClick={() => onChange(preset)}
            aria-label={preset}
            className={`w-6 h-6 rounded border transition-transform ${
              accent === preset ? 'border-white scale-105' : 'border-gray-700'
            }`}
            style={{ backgroundColor: preset }}
          />
        </HoverTextTooltip>
      ))}
    </div>
  )
}
