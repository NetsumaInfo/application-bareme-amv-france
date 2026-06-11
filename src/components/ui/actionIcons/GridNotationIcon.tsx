import type { LucideProps } from 'lucide-react'

export function GridNotationIcon({
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  ref,
  ...props
}: LucideProps) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M10 4.5V19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 9H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 14H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}
