// Global video element reference
// Used by usePlayer hook and VideoPlayer component
let _videoElement: HTMLVideoElement | null = null

export function setGlobalVideoElement(el: HTMLVideoElement | null) {
  _videoElement = el
}

export function getGlobalVideoElement(): HTMLVideoElement | null {
  return _videoElement
}
