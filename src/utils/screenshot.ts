import { writeBinaryFile } from '@tauri-apps/api/fs'
import * as tauri from '@/services/tauri'

export function screenshotTimestamp() {
  const now = new Date()
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

export function safeFilePart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'capture'
}

export function buildScreenshotName(page: string, label?: string) {
  const stamp = screenshotTimestamp()
  const safePage = safeFilePart(page)
  if (label) return `${safePage}-${safeFilePart(label)}-${stamp}.png`
  return `${safePage}-${stamp}.png`
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function captureElementToPngFile(
  element: HTMLElement,
  defaultName = 'screenshot-page.png',
): Promise<boolean> {
  const path = await tauri.saveScreenshotDialog(defaultName).catch(() => null)
  if (!path) return false

  if ('fonts' in document) {
    await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
  const { default: html2canvas } = await import('html2canvas')
  const baseOptions = {
    backgroundColor: '#0f0f23',
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
    onclone: (clonedDoc: Document) => {
      const style = clonedDoc.createElement('style')
      style.textContent = '*{animation:none !important;transition:none !important;caret-color:transparent !important;}'
      clonedDoc.head.appendChild(style)
    },
  } as const

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      ...baseOptions,
      foreignObjectRendering: true,
    })
  } catch {
    canvas = await html2canvas(element, baseOptions)
  }
  const dataUrl = canvas.toDataURL('image/png')
  await writeBinaryFile(path, dataUrlToBytes(dataUrl))
  return true
}
