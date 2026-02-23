interface ExportCheckboxProps {
  checked: boolean
  label: string
  onToggle: () => void
}

export function ExportCheckbox({ checked, label, onToggle }: ExportCheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="accent-primary-500"
      />
      {label}
    </label>
  )
}
