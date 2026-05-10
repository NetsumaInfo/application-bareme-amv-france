import { useI18n } from '@/i18n'

const SUBTLE_BORDER = 'ring-1 ring-inset ring-primary-400/10'
const CARD = `rounded-xl bg-surface/40 p-4 ${SUBTLE_BORDER}`
const SECTION_LABEL = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2'

export function SettingsAboutTab() {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('À propos de l’application')}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {t('Cette application est un outil de notation AMV. Elle aide les juges à organiser les clips, noter plus vite et garder un barème clair pendant un concours.')}
        </p>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Pourquoi ce projet existe')}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {t('Le projet a été créé pour simplifier le travail des jurys AMV, réduire les erreurs de notation et offrir un flux plus propre du visionnage jusqu’aux résultats.')}
        </p>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Créateur')}</p>
        <p className="text-sm text-gray-300">
          {t('Créateur : Netsuma')}
        </p>
        <a
          href="https://github.com/NetsumaInfo/application-bareme-amv-france"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs text-primary-300 hover:text-primary-200 underline decoration-primary-400/60"
        >
          {t('Repository GitHub : https://github.com/NetsumaInfo/application-bareme-amv-france')}
        </a>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>{t('Remerciements')}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {t('Merci aux bêta-testeurs et aux personnes qui ont donné des idées au projet.')}
        </p>
        <p className="mt-2 text-sm font-medium text-white">
          {t('Twister, Kuta, ShinRyu, Damis, Ligtning')}
        </p>
      </div>
    </div>
  )
}
