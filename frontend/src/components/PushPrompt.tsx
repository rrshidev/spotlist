'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/contexts/ToastContext';
import { subscribeUser, unsubscribeUser, sendTestPush, getPushPermission } from '@/lib/push';
import { Bell, BellOff, Loader2, Send } from 'lucide-react';

export function PushPrompt() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function check() {
      const perm = await getPushPermission();
      setPermission(perm);

      if (perm === 'granted' && 'serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          setSubscribed(!!sub);
        } catch {}
      }
      setLoading(false);
    }
    check();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const ok = await subscribeUser();
      if (ok) {
        setSubscribed(true);
        setPermission('granted');
        addToast(t('push.subscribed') || 'Уведомления включены', 'success');
      } else {
        addToast(t('push.denied') || 'Не удалось подписаться', 'error');
      }
    } catch {
      addToast(t('push.error') || 'Ошибка', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const ok = await unsubscribeUser();
      if (ok) {
        setSubscribed(false);
        addToast(t('push.unsubscribed') || 'Уведомления отключены', 'success');
      }
    } catch {
      addToast(t('push.error') || 'Ошибка', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const ok = await sendTestPush();
      if (ok) {
        addToast(t('push.testSent') || 'Тестовое отправлено', 'success');
      } else {
        addToast(t('push.error') || 'Ошибка', 'error');
      }
    } catch {
      addToast(t('push.error') || 'Ошибка', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-[#0a0a0f] rounded-xl">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
          <span className="text-white/40 text-sm">{t('push.loading') || '...'}</span>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-[#0a0a0f] rounded-xl">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-white text-sm font-medium">{t('push.blocked') || 'Уведомления заблокированы'}</p>
            <p className="text-white/40 text-xs">{t('push.blockedHint') || 'Включи в настройках браузера'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0a0a0f] rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className={`w-5 h-5 ${subscribed ? 'text-[#39ff14]' : 'text-white/40'}`} />
          <div>
            <p className="text-white text-sm font-medium">
              {subscribed ? (t('push.enabled') || 'Уведомления включены') : (t('push.disabled') || 'Уведомления выключены')}
            </p>
            <p className="text-white/40 text-xs">
              {subscribed
                ? (t('push.enabledHint') || 'Будете получать уведомления о новых сессиях')
                : (t('push.disabledHint') || 'Включите, чтобы не пропустить джемы')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {subscribed && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1.5 rounded-lg bg-[#39ff14]/20 text-[#39ff14] text-sm hover:bg-[#39ff14]/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t('push.test') || 'Тест'}
            </button>
          )}
          <button
            onClick={subscribed ? handleUnsubscribe : handleSubscribe}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${
              subscribed
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#39ff14]/20 text-[#39ff14] hover:bg-[#39ff14]/30'
            }`}
          >
            {subscribed ? (t('push.disable') || 'Отключить') : (t('push.enable') || 'Включить')}
          </button>
        </div>
      </div>
    </div>
  );
}
