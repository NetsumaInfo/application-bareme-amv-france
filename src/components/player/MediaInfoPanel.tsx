import { useEffect, useState } from 'react'
import { Copy, X } from 'lucide-react'
import * as tauri from '@/services/tauri'
import { formatTime } from '@/utils/formatters'

interface MediaInfoPanelProps {
  clipName: string
  filePath: string
  onClose: () => void
}

function buildFallbackInfo(filePath: string): tauri.MediaInfo {
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
  }
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

function formatBitrate(bps: number): string {
  if (bps <= 0) return '-'
  if (bps < 1000) return `${bps} bps`
  if (bps < 1000000) return `${(bps / 1000).toFixed(0)} kbps`
  return `${(bps / 1000000).toFixed(1)} Mbps`
}

function safeText(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-'
  return value.trim() ? value : '-'
}

export default function MediaInfoPanel({ clipName, filePath, onClose }: MediaInfoPanelProps) {
  const [info, setInfo] = useState<tauri.MediaInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fallback = buildFallbackInfo(filePath)
    const watchdog = setTimeout(() => {
      if (!active) return
      setError(null)
      setInfo((prev) => prev ?? fallback)
    }, 3000)

    tauri.playerGetMediaInfo(filePath)
      .then((next) => {
        if (!active) return
        clearTimeout(watchdog)
        setError(null)
        setInfo(next)
      })
      .catch((e) => {
        if (!active) return
        clearTimeout(watchdog)
        setError(null)
        setInfo((prev) => prev ?? fallback)
        console.warn('MediaInfo fallback used:', e)
      })

    return () => {
      active = false
      clearTimeout(watchdog)
    }
  }, [filePath])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const sections = info ? [
    {
      title: 'Vidéo',
      rows: [
        ['Résolution', info.width > 0 && info.height > 0 ? `${info.width} x ${info.height}` : '-'],
        ['FPS', info.fps > 0 ? info.fps.toFixed(3) : '-'],
        ['Codec', safeText(info.video_codec)],
        ['Profil', safeText(info.video_profile)],
        ['Format pixel', safeText(info.pixel_format)],
        ['Profondeur', info.video_bit_depth > 0 ? `${info.video_bit_depth} bits` : '-'],
        ['Frames', info.video_frame_count > 0 ? info.video_frame_count.toLocaleString('fr-FR') : '-'],
        ['SAR', safeText(info.sample_aspect_ratio)],
        ['DAR', safeText(info.display_aspect_ratio)],
        ['Espace couleur', safeText(info.color_space)],
        ['Primaires', safeText(info.color_primaries)],
        ['Transfert', safeText(info.color_transfer)],
        ['Débit vidéo', formatBitrate(info.video_bitrate)],
      ] as [string, string][],
    },
    {
      title: 'Audio',
      rows: [
        ['Codec', safeText(info.audio_codec)],
        ['Layout', safeText(info.audio_channel_layout)],
        ['Langue', safeText(info.audio_language)],
        ['Fréquence', info.sample_rate > 0 ? `${info.sample_rate} Hz` : '-'],
        ['Canaux', info.channels > 0 ? String(info.channels) : '-'],
        ['Débit audio', formatBitrate(info.audio_bitrate)],
      ] as [string, string][],
    },
    {
      title: 'Pistes',
      rows: [
        ['Pistes vidéo', info.video_track_count > 0 ? String(info.video_track_count) : '-'],
        ['Pistes audio', info.audio_track_count > 0 ? String(info.audio_track_count) : '-'],
        ['Pistes sous-titres', info.subtitle_track_count > 0 ? String(info.subtitle_track_count) : '-'],
      ] as [string, string][],
    },
    {
      title: 'Conteneur',
      rows: [
        ['Conteneur', safeText(info.format_name)],
        ['Format détaillé', safeText(info.format_long_name)],
        ['Durée', info.duration > 0 ? formatTime(info.duration) : '-'],
        ['Débit total', formatBitrate(info.overall_bitrate)],
        ['Taille fichier', formatBytes(info.file_size)],
      ] as [string, string][],
    },
  ] : []

  const copyToClipboard = async () => {
    if (!info) return
    const content = {
      clip: clipName,
      path: filePath,
      ...info,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2))
    } catch {
      // Ignore clipboard failures on restricted environments.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-gray-700 rounded-xl shadow-2xl w-[520px] max-w-[94vw] max-h-[86vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white truncate pr-2">
            MediaInfo — {clipName}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={copyToClipboard}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
              title="Copier les infos"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-light text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 overflow-y-auto max-h-[68vh]">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : !info ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <section key={section.title}>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-primary-300 mb-1.5">
                    {section.title}
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {section.rows.map(([label, value]) => (
                        <tr key={`${section.title}-${label}`} className="border-b border-gray-800 last:border-0">
                          <td className="py-1.5 pr-3 text-gray-400 whitespace-nowrap">{label}</td>
                          <td className="py-1.5 text-white font-mono text-xs">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-[10px] text-gray-600 truncate" title={filePath}>{filePath}</p>
        </div>
      </div>
    </div>
  )
}
