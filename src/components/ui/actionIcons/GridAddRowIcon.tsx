import type { LucideProps } from 'lucide-react'

export function GridAddRowIcon({
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  ref,
  ...props
}: LucideProps) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 5.5V18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 9H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}
