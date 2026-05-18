'use client';

import { useMap } from '@/contexts/MapContext';
import { useI18n } from '@/contexts/I18nContext';
import { Filter, Map as MapIcon, List, MapPin } from 'lucide-react';

interface FilterBarProps {
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
}



export function FilterBar({ viewMode, onViewModeChange }: FilterBarProps) {
  const { category, setCategory, radius, setRadius, city, setCity, obstacleType, setObstacleType, stairCount, setStairCount, rideType, setRideType } = useMap();
  const { t } = useI18n();

  const categories = [
    { value: '', label: t('filter.all') },
    { value: 'park', label: t('categories.park') },
    { value: 'street', label: t('categories.street') },
    { value: 'roller', label: t('categories.roller') },
    { value: 'routes', label: t('categories.routes') },
  ];

  const radiusOptions = [
    { value: 1, label: t('filter.radius.1') },
    { value: 5, label: t('filter.radius.5') },
    { value: 10, label: t('filter.radius.10') },
    { value: 25, label: t('filter.radius.25') },
    { value: 50, label: t('filter.radius.50') },
  ];

  const obstacleTypes = [
    { value: '', label: t('filter.allObstacles') },
    { value: 'ledge', label: `▬ ${t('obstacles.ledge')}` },
    { value: 'rail', label: `═ ${t('obstacles.rail')}` },
    { value: 'stairs', label: `⊞ ${t('obstacles.stairs')}` },
    { value: 'hubba', label: `╱ ${t('obstacles.hubba')}` },
    { value: 'gap', label: `⤉ ${t('obstacles.gap')}` },
    { value: 'bank', label: `╲ ${t('obstacles.bank')}` },
    { value: 'manual_pad', label: `▭ ${t('obstacles.manual_pad')}` },
    { value: 'bowl', label: `○ ${t('obstacles.bowl')}` },
    { value: 'quarter_pipe', label: `⌒ ${t('obstacles.quarter_pipe')}` },
    { value: 'wallride', label: `⊢ ${t('obstacles.wallride')}` },
  ];

  const rideTypes = [
    { value: '', label: t('filter.allRideTypes') },
    { value: 'skateboard', label: `🛹 ${t('rideTypesShort.skateboard')}` },
    { value: 'rollerblades', label: `🛼 ${t('rideTypesShort.rollerblades')}` },
    { value: 'bmx', label: `🚲 ${t('rideTypesShort.bmx')}` },
    { value: 'scooter', label: `🛴 ${t('rideTypesShort.scooter')}` },
    { value: 'longboard', label: `🛹 ${t('rideTypesShort.longboard')}` },
    { value: 'surfskate', label: `🛹 ${t('rideTypesShort.surfskate')}` },
    { value: 'mountainboard', label: `🛹 ${t('rideTypesShort.mountainboard')}` },
    { value: 'motorcycle', label: `🏍️ ${t('rideTypesShort.motorcycle')}` },
    { value: 'sup', label: `🏄 ${t('rideTypesShort.sup')}` },
    { value: 'kayak', label: `🛶 ${t('rideTypesShort.kayak')}` },
    { value: 'cycling', label: `🚲 ${t('rideTypesShort.cycling')}` },
    { value: 'running', label: `🏃 ${t('rideTypesShort.running')}` },
    { value: 'hiking', label: `🥾 ${t('rideTypesShort.hiking')}` },
    { value: 'other', label: `⭐ ${t('rideTypesShort.other')}` },
  ];

  return (
    <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-white/60">{t('filter.title')}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                category === cat.value
                  ? 'bg-[#39ff14] text-black'
                  : 'bg-[#1f1f2e] text-white/70 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm border-none outline-none cursor-pointer"
        >
          {radiusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <select
            value={obstacleType}
            onChange={(e) => setObstacleType(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm border-none outline-none cursor-pointer"
          >
            {obstacleTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {obstacleType === 'stairs' && (
            <input
              type="number"
              min="1"
              max="50"
              value={stairCount}
              onChange={(e) => setStairCount(e.target.value)}
              placeholder={t('filter.stairsCount')}
              className="w-36 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm border-none outline-none placeholder:text-white/40"
            />
          )}
        </div>

        <select
          value={rideType}
          onChange={(e) => setRideType(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm border-none outline-none cursor-pointer"
        >
          {rideTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <div className="w-48 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white/60 text-sm">
          <MapPin className="w-4 h-4 text-[#39ff14]" />
          {city || t('filter.allCities')}
        </div>

        <div className="flex items-center gap-2 bg-[#1f1f2e] rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-[#39ff14] text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-[#39ff14] text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {city && (
        <div className="mt-3 pt-3 border-t border-[#1f1f2e] flex items-center gap-2">
          <span className="text-sm text-[#39ff14]">{t('filter.city')} {city}</span>
          <button
            onClick={() => setCity('')}
            className="text-xs text-white/40 hover:text-white ml-2"
          >
            {t('filter.reset')}
          </button>
        </div>
      )}
    </div>
  );
}