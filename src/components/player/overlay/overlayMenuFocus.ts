// Shared flag (overlay window scope) telling overlay focus logic to back off
// while the floating player context-menu window is open. Without this, the
// overlay re-focuses itself (mousemove / fullscreen interval) and steals focus
// from the menu window, which would then close on blur.

let playerMenuOpen = false

export function setPlayerMenuOpen(open: boolean): void {
  playerMenuOpen = open
}

export function isPlayerMenuOpen(): boolean {
  return playerMenuOpen
}
