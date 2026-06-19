'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Heart, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const BANKS = [
  { key: 'sber', number: '2202 2082 9176 6369', gradient: 'from-[#1a6d1a] to-[#2ea82e]' },
  { key: 'vtb', number: '2200 2414 1778 2384', gradient: 'from-[#003791] to-[#0091d4]' },
  { key: 'tbank', number: '2200 7005 4579 6921', gradient: 'from-[#1a1a2e] to-[#2d1b4e]' },
  { key: 'ozon', number: '2204 3201 8554 1721', gradient: 'from-[#0d0d14] to-[#1a0033]' },
];

export default function DonatePage() {
  const { t } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, num: string) => {
    try {
      await navigator.clipboard.writeText(num.replace(/\s/g, ''));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main className="flex-1 flex items-start justify-center p-4 pt-10">
      <div className="max-w-2xl w-full">
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff1493] to-[#ff6b9d] flex items-center justify-center mx-auto shadow-lg shadow-[#ff1493]/20">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{t('donate.title')}</h1>
            <p className="text-[#ff1493] font-medium text-sm">{t('donate.subtitle')}</p>
          </div>

          <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
            {t('donate.description')}
          </p>

          <p className="text-white/50 text-xs italic max-w-sm mx-auto">
            {t('donate.supportSkateboarding')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BANKS.map((bank) => {
              const isCopied = copiedId === bank.key;
              return (
                <div
                  key={bank.key}
                  className={`rounded-xl p-4 bg-gradient-to-br ${bank.gradient} border border-white/10 shadow-lg flex flex-col justify-between min-h-[130px] transition-transform hover:scale-[1.02]`}
                >
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    {t(`donate.${bank.key}`)}
                  </p>
                  <p className="text-white font-mono text-sm tracking-wider mt-2">
                    {bank.number}
                  </p>
                  <button
                    onClick={() => handleCopy(bank.key, bank.number)}
                    className="mt-3 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white text-xs"
                  >
                    {isCopied ? (
                      <><Check className="w-3.5 h-3.5 text-[#39ff14]" /> {t('donate.copied')}</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> {t('donate.copy')}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[#ff1493] font-semibold text-lg pt-2">
            {t('donate.thankYou')}
          </p>
        </div>
      </div>
    </main>
  );
}
