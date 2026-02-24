import type { MediaInfo } from '@/services/tauri'

export function buildFallbackInfo(filePath: string): MediaInfo {
  const extension = filePath.split('.').pop()?.toLowerCase() ?? ''
  return {
    width: 0,
    height: 0,
    video_codec: '',
    audio_codec: '',
    file_size: 0,
    video_bitrate: 0,
    audio_bitrate: 0,
    fps: 0,
    sample_rate: 0,
    channels: 0,
    format_name: extension,
    duration: 0,
    format_long_name: '',
    overall_bitrate: 0,
    video_profile: '',
    pixel_format: '',
    color_space: '',
    color_primaries: '',
    color_transfer: '',
    video_bit_depth: 0,
    audio_channel_layout: '',
    audio_language: '',
    audio_track_count: 0,
    video_track_count: 0,
    subtitle_track_count: 0,
    video_frame_count: 0,
    sample_aspect_ratio: '',
    display_aspect_ratio: '',
    rotation_degrees: 0,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

export function formatBitrate(bps: number): string {
  if (bps <= 0) return '-'
  if (bps < 1000) return `${bps} bps`
  if (bps < 1000000) return `${(bps / 1000).toFixed(0)} kbps`
  return `${(bps / 1000000).toFixed(1)} Mbps`
}

export function safeText(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-'
  return value.trim() ? value : '-'
}
