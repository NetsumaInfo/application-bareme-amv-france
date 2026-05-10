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

const MediaInfoIcon = forwardRef<SVGSVGElement, LucideProps>(function MediaInfoIcon(
  { color = 'currentColor', size = 24, strokeWidth = 1.35, ...props },
  ref,
) {
  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
      <path fill={color} d="M20.833 26.832a.75.75 0 0 1-1.5 0a.75.75 0 0 1 1.5 0" />
      <path
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.532 5.5c11.397 0 20.636 8.283 20.636 18.5h0c0 10.217-9.24 18.5-20.636 18.5q-.515 0-1.026-.023c9.948-.491 17.756-8.618 17.756-18.477h0c0-9.739-7.625-17.81-17.44-18.474q.354-.03.71-.026m9.176 18.617c0-6.09-4.223-11.134-9.648-11.53c.133-.013.266-.015.4-.015c7.145 0 12.937 5.17 12.937 11.545S28.605 35.663 21.46 35.663q-.295 0-.587-.012c5.503-.28 9.835-5.36 9.835-11.534m-12.343-1.816a1.719 1.719 0 0 1 3.437-.001c0 .475-.16.94-.503 1.216c-.356.285-1.222.753-1.222 1.48M26.17 24a6.085 6.085 0 0 1-6.085 6.085h0A6.085 6.085 0 1 1 26.167 24zM11.028 6.097v35.938M8.431 6.097v35.938M5.832 6.097v35.938"
      />
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
  mediaInfo: MediaInfoIcon,
  miniatures: Image,
  rename: Pencil,
  swap: ArrowUpDown,
} satisfies Record<string, LucideIcon>
