import { useProjectFileActions } from '@/components/project/useProjectFileActions'
import { useProjectVideoActions } from '@/components/project/useProjectVideoActions'

export function useProjectMenuActions() {
  const fileActions = useProjectFileActions()
  const videoActions = useProjectVideoActions()

  return {
    ...fileActions,
    ...videoActions,
  }
}
