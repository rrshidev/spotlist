'use client';

import { useMap } from '@/contexts/MapContext';
import { Filter, Map as MapIcon, List, MapPin } from 'lucide-react';

interface FilterBarProps {
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
}

const categories = [
  { value: '', label: 'Все' },
  { value: 'park', label: 'Парк' },
  { value: 'street', label: 'Стрит' },
  { value: 'roller', label: 'Роллер-дром' },
  { value: 'routes', label: 'Маршруты' },
];

const radiusOptions = [
  { value: 1, label: '1 км' },
  { value: 5, label: '5 км' },
  { value: 10, label: '10 км' },
  { value: 25, label: '25 км' },
  { value: 50, label: '50 км' },
];

const obstacleTypes = [
  { value: '', label: 'Все препятствия' },
  { value: 'ledge', label: '▬ Ледж' },
  { value: 'rail', label: '═ Рейл' },
  { value: 'stairs', label: '⊞ Лестница' },
  { value: 'hubba', label: '╱ Хабба' },
  { value: 'gap', label: '⤉ Гэп' },
  { value: 'bank', label: '╲ Банк' },
  { value: 'manual_pad', label: '▭ Мануал-пад' },
  { value: 'bowl', label: '○ Боул' },
  { value: 'quarter_pipe', label: '⌒ Квотер' },
  { value: 'wallride', label: '⊢ Валлрайд' },
];

export function FilterBar({ viewMode, onViewModeChange }: FilterBarProps) {
  const { category, setCategory, radius, setRadius, city, setCity, obstacleType, setObstacleType, stairCount, setStairCount } = useMap();

  return (
    <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-white/60">Фильтры:</span>
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
              placeholder="Кол-во ступеней"
              className="w-36 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm border-none outline-none placeholder:text-white/40"
            />
          )}
        </div>

        <div className="flex-1" />

        <div className="w-48 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white/60 text-sm">
          <MapPin className="w-4 h-4 text-[#39ff14]" />
          {city || 'Все города'}
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
          <span className="text-sm text-[#39ff14]">Город: {city}</span>
          <button
            onClick={() => setCity('')}
            className="text-xs text-white/40 hover:text-white ml-2"
          >
            сбросить
          </button>
        </div>
      )}
    </div>
  );
}