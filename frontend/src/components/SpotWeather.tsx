'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { WeatherData } from '@/types';
import { Cloud, Droplets, Wind, Loader2, Thermometer } from 'lucide-react';

export function SpotWeather({ spotId }: { spotId: string }) {
  const { t } = useI18n();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const data = await api.weather.get(spotId);
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [spotId]);

  if (loading) return null;
  if (error || !weather) return null;

  const iconUrl = weather.icon
    ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
    : null;

  return (
    <div className="mt-4 p-4 bg-[#0a0a0f] rounded-xl">
      <p className="text-sm text-white/60 mb-3">{t('weather.title')}</p>
      <div className="flex items-center gap-4">
        {iconUrl && (
          <img src={iconUrl} alt={weather.description} className="w-14 h-14 -my-2" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#39ff14]" />
            <span className="text-2xl font-bold text-white">{weather.temp}°C</span>
            <span className="text-sm text-white/60 capitalize">{weather.description}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" />
              {t('weather.feelsLike')} {weather.feels_like}°C
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5" />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />
              {weather.wind_speed} {t('weather.mps')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
