'use client';

import { useI18n } from '@/contexts/I18nContext';
import type { Locale } from '@/i18n/config';
import { locales, localeNames } from '@/i18n/config';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1">
      {locales.map((l: Locale) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
            locale === l
              ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/40'
              : 'text-white/40 hover:text-white/80 border border-transparent'
          }`}
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );
}
