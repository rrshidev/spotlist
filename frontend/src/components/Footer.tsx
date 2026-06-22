'use client';

import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#12121a] border-t border-[#1f1f2e]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://t.me/SkateBoardWorldNewsRussia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              {t('footer.telegram')}
            </a>
            <Link
              href="/partnership"
              className="text-white/50 hover:text-white transition-colors"
            >
              {t('footer.partner')}
            </Link>
            <Link
              href="/donate"
              className="text-white/50 hover:text-white transition-colors"
            >
              {t('footer.donate')}
            </Link>
          </div>
          <div className="text-sm text-white/30">
            &copy; SpotList {year}
          </div>
        </div>
      </div>
    </footer>
  );
}
