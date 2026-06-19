'use client';

import { useEffect } from 'react';

function setCookie(name: string, value: string, days = 30) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

export function UTMTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const ref = params.get('ref');

    if (utmSource) setCookie('utm_source', utmSource);
    if (utmMedium) setCookie('utm_medium', utmMedium);
    if (utmCampaign) setCookie('utm_campaign', utmCampaign);
    if (ref) setCookie('ref', ref);
  }, []);

  return null;
}
