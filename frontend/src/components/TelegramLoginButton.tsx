'use client';

import { useEffect, useRef } from 'react';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  onAuth: (user: TelegramUser) => void;
  buttonSize?: 'large' | 'medium' | 'small';
}

export default function TelegramLoginButton({ onAuth, buttonSize = 'large' }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BOT_USERNAME) return;

    window.onTelegramAuth = (user) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    const container = containerRef.current;
    if (container) {
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [onAuth, buttonSize]);

  if (!BOT_USERNAME) {
    return (
      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
        Telegram login not configured
      </div>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
