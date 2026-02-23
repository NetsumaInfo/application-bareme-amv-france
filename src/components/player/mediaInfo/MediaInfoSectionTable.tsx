import type { MediaInfoSection } from '@/components/player/mediaInfo/mediaInfoSections'

interface MediaInfoSectionTableProps {
  section: MediaInfoSection
}

export function MediaInfoSectionTable({ section }: MediaInfoSectionTableProps) {
  return (
    <section>
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
  )
}
