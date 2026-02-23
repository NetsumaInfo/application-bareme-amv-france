interface ScoreRingProps {
  value: number
  max: number
  size?: number
}

export function ScoreRing({ value, max, size = 48 }: ScoreRingProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const color =
    percentage >= 75
      ? 'text-green-400'
      : percentage >= 50
        ? 'text-yellow-400'
        : percentage > 0
          ? 'text-accent'
          : 'text-gray-600'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-150`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{value || '-'}</span>
      </div>
    </div>
  )
}
