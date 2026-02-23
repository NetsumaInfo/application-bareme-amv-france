export function insertTextAtCursor(
  textarea: HTMLTextAreaElement,
  insertion: string,
): { nextValue: string; caret: number } {
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? start
  const value = textarea.value
  const before = value.slice(0, start)
  const after = value.slice(end)
  const needsSpaceBefore = before.length > 0 && !/\s$/.test(before)
  const needsSpaceAfter = after.length > 0 && !/^\s/.test(after)
  const insert = `${needsSpaceBefore ? ' ' : ''}${insertion}${needsSpaceAfter ? ' ' : ''}`
  const nextValue = `${before}${insert}${after}`
  const caret = before.length + insert.length
  return { nextValue, caret }
}
