import { forwardRef } from 'react'
import {
  ArrowUpDown,
  BarChart2,
  Clapperboard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image,
  Pencil,
  Play,
  Share2,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

const GridAddRowIcon = forwardRef<SVGSVGElement, LucideProps>(function GridAddRowIcon(
  { color = 'currentColor', size = 24, strokeWidth = 2, ...props },
  ref,
) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 5.5V18.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 9H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}) as LucideIcon

const GridSpreadsheetIcon = forwardRef<SVGSVGElement, LucideProps>(function GridSpreadsheetIcon(
  { color = 'currentColor', size = 24, strokeWidth = 2, ...props },
  ref,
) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M11.5 5V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 10H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 14.5H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}) as LucideIcon

export const UI_ICONS = {
  addRow: GridAddRowIcon,
  spreadsheet: GridSpreadsheetIcon,
  notation: forwardRef<SVGSVGElement, LucideProps>(function GridNotationIcon(
    { color = 'currentColor', size = 24, strokeWidth = 2, ...props },
    ref,
  ) {
    return (
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
        <rect x="4" y="4" width="16" height="16" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
        <path d="M10 4.5V19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M4.5 9H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M4.5 14H19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    )
  }) as LucideIcon,
  results: BarChart2,
  export: Download,
  share: Share2,
  player: Play,
  detailedNotes: Clapperboard,
  detailedNotesSecondary: FileText,
  generalNote: FileText,
  show: Eye,
  hide: EyeOff,
  pip: Play,
  miniatures: Image,
  rename: Pencil,
  swap: ArrowUpDown,
} satisfies Record<string, LucideIcon>
