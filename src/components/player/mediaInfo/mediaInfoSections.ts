import { formatTime } from '@/utils/formatters'
import { formatBitrate, formatBytes, safeText } from '@/components/player/mediaInfo/mediaInfoFormatters'
import type { MediaInfo } from '@/services/tauri'

export interface MediaInfoSection {
  title: string
  rows: [string, string][]
}

export function buildMediaInfoSections(info: MediaInfo): MediaInfoSection[] {
  return [
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
        ['Rotation', info.rotation_degrees ? `${info.rotation_degrees}\u00b0` : '0\u00b0'],
        ['Espace couleur', safeText(info.color_space)],
        ['Primaires', safeText(info.color_primaries)],
        ['Transfert', safeText(info.color_transfer)],
        ['Débit vidéo', formatBitrate(info.video_bitrate)],
      ],
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
      ],
    },
    {
      title: 'Pistes',
      rows: [
        ['Pistes vidéo', info.video_track_count > 0 ? String(info.video_track_count) : '-'],
        ['Pistes audio', info.audio_track_count > 0 ? String(info.audio_track_count) : '-'],
        ['Pistes sous-titres', info.subtitle_track_count > 0 ? String(info.subtitle_track_count) : '-'],
      ],
    },
    {
      title: 'Conteneur',
      rows: [
        ['Conteneur', safeText(info.format_name)],
        ['Format détaillé', safeText(info.format_long_name)],
        ['Durée', info.duration > 0 ? formatTime(info.duration) : '-'],
        ['Débit total', formatBitrate(info.overall_bitrate)],
        ['Taille fichier', formatBytes(info.file_size)],
      ],
    },
  ]
}
