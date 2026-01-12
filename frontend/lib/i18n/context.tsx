'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Translations } from './types';
import zhTranslations from './translations/zh.json';
import enTranslations from './translations/en.json';

const translations: Record<Locale, Translations> = {
  zh: zhTranslations as Translations,
  en: enTranslations as Translations,
};

const STORAGE_KEY = 'doc-studio-locale';
const DEFAULT_LOCALE: Locale = 'zh';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof result === 'string' ? result : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'zh' || stored === 'en')) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    return getNestedValue(translations[locale], key);
  }, [locale]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: DEFAULT_LOCALE, setLocale, t: (key) => getNestedValue(translations[DEFAULT_LOCALE], key) }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
