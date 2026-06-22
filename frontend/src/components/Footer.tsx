'use client';

import Link from 'next/link';
import { Handshake, Heart, Send } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#12121a] border-t border-[#1f1f2e]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href="https://t.me/SkateBoardWorldNewsRussia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              title={t('footer.telegram')}
            >
              <Send className="w-5 h-5" />
            </a>
            <Link
              href="/partnership"
              className="text-white/50 hover:text-[#39ff14] transition-colors"
              title={t('footer.partner')}
            >
              <Handshake className="w-5 h-5" />
            </Link>
            <Link
              href="/donate"
              className="text-white/50 hover:text-[#ff1493] transition-colors"
              title={t('footer.donate')}
            >
              <Heart className="w-5 h-5" />
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
