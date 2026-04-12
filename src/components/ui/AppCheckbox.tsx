import { Check } from 'lucide-react'

interface AppCheckboxProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export function AppCheckbox({ checked, label, onChange, className = '', disabled = false }: AppCheckboxProps) {
  return (
    <label
      className={`group flex items-center gap-2 text-[11px] text-gray-300 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`.trim()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] ring-1 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/35 ${
          checked
            ? 'bg-primary-500/12 ring-primary-400/14 text-primary-200'
            : 'bg-white/[0.03] ring-primary-400/10 text-transparent'
        } ${disabled ? '' : 'group-hover:bg-white/[0.06]'}`}
      >
        <Check size={11} strokeWidth={2.5} />
      </span>
      <span>{label}</span>
    </label>
  )
}
