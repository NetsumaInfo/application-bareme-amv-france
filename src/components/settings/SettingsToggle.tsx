export function SettingsToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ring-1 ring-inset ${checked ? 'bg-primary-600 ring-primary-400/10' : 'bg-gray-700 ring-primary-400/10'
        }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''
          }`}
      />
    </button>
  )
}
