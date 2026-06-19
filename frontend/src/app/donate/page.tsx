'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Heart, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const DONATE_PHONE = process.env.NEXT_PUBLIC_DONATE_PHONE || '+79532863360';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(DONATE_PHONE)}`;

function formatPhone(phone: string) {
  const m = phone.replace(/\D/g, '').match(/^(\d)(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return phone;
  return `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}-${m[5]}`;
}

export default function DonatePage() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DONATE_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff6b9d] flex items-center justify-center mx-auto shadow-lg shadow-[#ff1493]/20">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('donate.title')}</h1>
            <p className="text-[#ff1493] font-medium text-sm">{t('donate.subtitle')}</p>
          </div>

          <p className="text-white/60 text-sm leading-relaxed">
            {t('donate.description')}
          </p>

          <p className="text-white/50 text-xs italic">
            {t('donate.supportSkateboarding')}
          </p>

          <div className="bg-[#0d0d14] border border-[#1f1f2e] rounded-xl p-4 space-y-3">
            <p className="text-white/50 text-xs uppercase tracking-wider">{t('donate.phoneLabel')}</p>

            <div className="flex items-center justify-center gap-3">
              <a
                href={`tel:${DONATE_PHONE}`}
                className="text-[#39ff14] text-xl font-mono font-bold hover:text-[#32e612] transition-colors"
              >
                {formatPhone(DONATE_PHONE)}
              </a>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-[#1f1f2e] hover:bg-[#2a2a3e] transition-colors"
                title={t('donate.phoneLabel')}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[#39ff14]" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>

            <p className="text-white/40 text-xs">{t('donate.banks')}</p>
          </div>

          <div className="bg-white rounded-xl p-2 inline-block mx-auto shadow-lg">
            <img
              src={QR_URL}
              alt={t('donate.qrAlt')}
              width={300}
              height={300}
              className="rounded-lg"
            />
          </div>

          <p className="text-[#ff1493] font-semibold text-lg">
            {copied ? t('donate.phoneCopy') : t('donate.thankYou')}
          </p>
        </div>
      </div>
    </main>
  );
}
