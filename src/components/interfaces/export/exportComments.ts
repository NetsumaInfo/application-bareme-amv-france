import type { JudgeSource } from '@/utils/results'

/**
 * Per-judge notes carry a free-text general comment (`textNotes`) that is not part
 * of the numeric `NoteLike` shape, so we read it defensively.
 */
interface JudgeNoteWithText {
  textNotes?: unknown
}

function judgeClipComment(judge: JudgeSource, clipId: string): string {
  const note = judge.notes[clipId] as JudgeNoteWithText | undefined
  return typeof note?.textNotes === 'string' ? note.textNotes.trim() : ''
}

export interface BuildClipCommentOptions {
  judges: JudgeSource[]
  /**
   * When provided (judge view), only this judge's comment is used and it is not
   * prefixed with the judge name. Otherwise every judge's comment is joined and
   * each line is prefixed with the judge name.
   */
  singleJudgeIndex?: number
}

/**
 * Builds the comment cell text for a clip in the results table exports.
 * Returns an empty string when no judge left a comment.
 */
export function buildClipComment(clipId: string, options: BuildClipCommentOptions): string {
  const { judges, singleJudgeIndex } = options

  if (singleJudgeIndex !== undefined) {
    const judge = judges[singleJudgeIndex]
    return judge ? judgeClipComment(judge, clipId) : ''
  }

  return judges
    .flatMap((judge) => {
      const text = judgeClipComment(judge, clipId)
      return text ? [`${judge.judgeName}: ${text}`] : []
    })
    .join('\n')
}
