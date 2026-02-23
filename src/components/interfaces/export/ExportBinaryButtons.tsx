interface ExportBinaryButtonsProps<T extends string> {
  value: T
  left: { label: string; value: T }
  right: { label: string; value: T }
  onChange: (value: T) => void
}

export function ExportBinaryButtons<T extends string>({
  value,
  left,
  right,
  onChange,
}: ExportBinaryButtonsProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange(left.value)}
        className={`px-2 py-1.5 rounded text-xs border transition-colors ${
          value === left.value
            ? 'border-primary-500 text-primary-300 bg-primary-600/10'
            : 'border-gray-700 text-gray-400 hover:text-white'
        }`}
      >
        {left.label}
      </button>
      <button
        onClick={() => onChange(right.value)}
        className={`px-2 py-1.5 rounded text-xs border transition-colors ${
          value === right.value
            ? 'border-primary-500 text-primary-300 bg-primary-600/10'
            : 'border-gray-700 text-gray-400 hover:text-white'
        }`}
      >
        {right.label}
      </button>
    </div>
  )
}
