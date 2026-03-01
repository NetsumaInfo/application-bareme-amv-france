import { formatTime } from '@/utils/formatters'
import { formatBitrate, formatBytes, safeText } from '@/components/player/mediaInfo/mediaInfoFormatters'
import type { MediaInfo } from '@/services/tauri'
import type { TranslateFn } from '@/i18n/context'

export interface MediaInfoSection {
  title: string
  rows: [string, string][]
}

export function buildMediaInfoSections(info: MediaInfo, t: TranslateFn): MediaInfoSection[] {
  return [
    {
      title: t('Vidéo'),
      rows: [
        [t('Résolution'), info.width > 0 && info.height > 0 ? `${info.width} x ${info.height}` : '-'],
        ['FPS', info.fps > 0 ? info.fps.toFixed(3) : '-'],
        [t('Codec'), safeText(info.video_codec)],
        [t('Profil'), safeText(info.video_profile)],
        [t('Format pixel'), safeText(info.pixel_format)],
        [t('Profondeur'), info.video_bit_depth > 0 ? `${info.video_bit_depth} ${t('bits')}` : '-'],
        [t('Frames'), info.video_frame_count > 0 ? info.video_frame_count.toLocaleString('fr-FR') : '-'],
        ['SAR', safeText(info.sample_aspect_ratio)],
        ['DAR', safeText(info.display_aspect_ratio)],
        [t('Rotation'), info.rotation_degrees ? `${info.rotation_degrees}\u00b0` : '0\u00b0'],
        [t('Espace couleur'), safeText(info.color_space)],
        [t('Primaires'), safeText(info.color_primaries)],
        [t('Transfert'), safeText(info.color_transfer)],
        [t('Débit vidéo'), formatBitrate(info.video_bitrate)],
      ],
    },
    {
      title: t('Audio'),
      rows: [
        [t('Codec'), safeText(info.audio_codec)],
        [t('Layout'), safeText(info.audio_channel_layout)],
        [t('Langue'), safeText(info.audio_language)],
        [t('Fréquence'), info.sample_rate > 0 ? `${info.sample_rate} Hz` : '-'],
        [t('Canaux'), info.channels > 0 ? String(info.channels) : '-'],
        [t('Débit audio'), formatBitrate(info.audio_bitrate)],
      ],
    },
    {
      title: t('Pistes'),
      rows: [
        [t('Pistes vidéo'), info.video_track_count > 0 ? String(info.video_track_count) : '-'],
        [t('Pistes audio'), info.audio_track_count > 0 ? String(info.audio_track_count) : '-'],
        [t('Pistes sous-titres'), info.subtitle_track_count > 0 ? String(info.subtitle_track_count) : '-'],
      ],
    },
    {
      title: t('Conteneur'),
      rows: [
        [t('Conteneur'), safeText(info.format_name)],
        [t('Format détaillé'), safeText(info.format_long_name)],
        [t('Durée'), info.duration > 0 ? formatTime(info.duration) : '-'],
        [t('Débit total'), formatBitrate(info.overall_bitrate)],
        [t('Taille fichier'), formatBytes(info.file_size)],
      ],
    },
  ]
}
