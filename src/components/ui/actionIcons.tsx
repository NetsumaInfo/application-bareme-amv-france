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
} from 'lucide-react'
import { GridAddRowIcon } from '@/components/ui/actionIcons/GridAddRowIcon'
import { GridSpreadsheetIcon } from '@/components/ui/actionIcons/GridSpreadsheetIcon'
import { GridNotationIcon } from '@/components/ui/actionIcons/GridNotationIcon'
import { MediaInfoIcon } from '@/components/ui/actionIcons/MediaInfoIcon'

export const UI_ICONS = {
  addRow: GridAddRowIcon as LucideIcon,
  spreadsheet: GridSpreadsheetIcon as LucideIcon,
  notation: GridNotationIcon as LucideIcon,
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
  mediaInfo: MediaInfoIcon as LucideIcon,
  miniatures: Image,
  rename: Pencil,
  swap: ArrowUpDown,
} satisfies Record<string, LucideIcon>
