'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">{t('home.title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('home.subtitle')}
        </p>
        <p className="text-muted-foreground mb-8">
          {t('home.description')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            {t('home.loginBtn')}
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
          >
            {t('home.registerBtn')}
          </Link>
        </div>
      </div>
    </main>
  );
}
