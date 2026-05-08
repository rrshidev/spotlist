'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useMap } from '@/contexts/MapContext';
import { MapPin, Loader2, X } from 'lucide-react';

interface CitySearchResult {
  city?: string;
  display_name?: string;
  lat?: number;
  lon?: number;
}

export function CitySearch() {
  const { city, setCity } = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.geo.search(query);
        if (Array.isArray(data)) {
          const validResults = data
            .filter((r) => r && r.city && typeof r.lat === 'number' && typeof r.lon === 'number')
            .slice(0, 5);
          setResults(validResults);
          setShowResults(true);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error('City search error:', e);
        setError('Ошибка поиска');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: CitySearchResult) => {
    if (result.city) {
      setCity(result.city);
    }
    setQuery('');
    setShowResults(false);
    setShowInput(false);
  };

  const handleClear = () => {
    setCity('');
    setShowInput(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative">
      {!showInput && !city ? (
        <button
          onClick={() => {
            setShowInput(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f1f2e] text-white text-sm hover:bg-[#2a2a3e] transition-colors w-full"
        >
          <MapPin className="w-4 h-4 text-[#39ff14]" />
          Найти город...
        </button>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Введите название города..."
            className="w-full px-4 py-2 rounded-lg bg-[#1f1f2e] text-white text-sm border border-[#39ff14]/30 outline-none focus:border-[#39ff14]/60"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-[#39ff14] animate-spin" />
            </div>
          )}
          {!loading && query && (
            <button
              onClick={() => {
                setQuery('');
                setShowInput(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1f1f2e] rounded-lg overflow-hidden z-50 max-h-60 overflow-auto">
              {results
                .filter((r) => r && r.city)
                .map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#2a2a3e] transition-colors"
                  >
                    <div className="font-medium">{result.city || 'Unknown'}</div>
                    <div className="text-xs text-white/50 truncate">{result.display_name || ''}</div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {city && (
        <div className="mt-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-[#39ff14]">{city}</span>
          <button
            onClick={handleClear}
            className="text-xs text-white/40 hover:text-white ml-2"
          >
            сбросить
          </button>
        </div>
      )}
    </div>
  );
}