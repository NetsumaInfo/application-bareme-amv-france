import type { LucideIcon } from 'lucide-react'

interface AppContextMenuItemProps {
  label: string
  icon?: LucideIcon
  iconSecondary?: LucideIcon
  shortcut?: string
  disabled?: boolean
  active?: boolean
  danger?: boolean
  dense?: boolean
  onClick?: () => void
}

export function AppContextMenuItem({
  label,
  icon: Icon,
  iconSecondary: IconSecondary,
  shortcut,
  disabled = false,
  active = false,
  danger = false,
  dense = false,
  onClick,
}: AppContextMenuItemProps) {
  const isClickable = !disabled && typeof onClick === 'function'
  const textClassName = disabled
    ? 'text-slate-500'
    : danger
      ? 'text-rose-300'
      : active
        ? 'text-primary-200'
        : 'text-slate-200'
  const hoverClassName = disabled
    ? ''
    : active
      ? 'bg-primary-500/10'
      : 'hover:bg-white/4'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`group flex w-full items-center text-left transition-colors ${
        dense ? 'gap-1 rounded px-1.5 py-1' : 'gap-1.5 rounded-md px-1.5 py-1.5'
      } ${hoverClassName} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      {(Icon || IconSecondary) ? (
        <span
          className={`relative flex items-center justify-center rounded-md ${dense ? 'h-4 min-w-4' : 'h-6 min-w-6'} ${
            disabled
              ? 'text-slate-500'
              : danger
                ? 'text-rose-300'
                : active
                  ? 'text-primary-200'
                  : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {Icon ? <Icon size={dense ? 12 : 13.5} strokeWidth={1.85} /> : null}
          {IconSecondary ? (
            <span
              className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[rgb(var(--color-surface-dark)/0.96)] ${
                disabled
                  ? 'text-slate-500'
                  : danger
                    ? 'text-rose-300'
                    : active
                      ? 'text-primary-200'
                      : 'text-slate-300'
              }`}
            >
              <IconSecondary size={8} strokeWidth={1.85} />
            </span>
          ) : null}
        </span>
      ) : null}

      <span className={`flex-1 font-medium ${dense ? 'text-[10px] leading-[13px]' : 'text-[10.5px] leading-4'} ${textClassName}`}>{label}</span>

      {shortcut ? (
        <span className={`text-[9px] leading-none ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>{shortcut}</span>
      ) : null}
    </button>
  )
}
