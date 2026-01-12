'use client';

import { useTranslation } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'zh' ? 'en' : 'zh';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2 py-1.5 text-sm hover:bg-secondary rounded-lg transition"
      title={t('language.switch')}
    >
      <Globe className="w-4 h-4" />
      <span>{t(`language.${locale}`)}</span>
    </button>
  );
}
