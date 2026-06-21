'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Handshake, MessageCircle, Sparkles, Users, Trophy } from 'lucide-react';

export default function PartnershipPage() {
  const { t } = useI18n();

  const offers = [
    { icon: <Sparkles className="w-6 h-6" />, key: 'offer1' },
    { icon: <Users className="w-6 h-6" />, key: 'offer2' },
    { icon: <Trophy className="w-6 h-6" />, key: 'offer3' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center">
            <Handshake className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('partner.title')}</h1>
            <p className="text-sm text-white/50">{t('partner.subtitle')}</p>
          </div>
        </div>

        <p className="text-white/70 leading-relaxed mb-10">
          {t('partner.description')}
        </p>

        <h2 className="text-lg font-semibold text-white mb-4">{t('partner.offerTitle')}</h2>
        <div className="grid gap-4 mb-10">
          {offers.map((offer) => (
            <div
              key={offer.key}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#12121a] border border-[#1f1f2e]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#39ff14]/10 text-[#39ff14] flex items-center justify-center shrink-0">
                {offer.icon}
              </div>
              <span className="text-white/80">{t(`partner.${offer.key}`)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-[#39ff14]/10 to-[#00f5ff]/5 border border-[#39ff14]/20 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">{t('partner.contactTitle')}</h2>
          <p className="text-white/60 mb-4">{t('partner.contactText')}</p>
          <a
            href="https://t.me/rrshidev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#39ff14] text-black font-semibold hover:bg-[#39ff14]/90 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {t('partner.contactButton')}
          </a>
        </div>
      </div>
    </div>
  );
}
