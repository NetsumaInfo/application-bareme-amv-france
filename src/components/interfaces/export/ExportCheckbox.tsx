import { AppCheckbox } from '@/components/ui/AppCheckbox'

interface ExportCheckboxProps {
  checked: boolean
  label: string
  onToggle: () => void
}

export function ExportCheckbox({ checked, label, onToggle }: ExportCheckboxProps) {
  return <AppCheckbox checked={checked} label={label} onChange={onToggle} className="text-xs" />
}
