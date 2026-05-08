'use client';

import { useState, useEffect } from 'react';
import { useMap } from '@/contexts/MapContext';
import { api } from '@/lib/api';
import { Spot, SpotListResponse } from '@/types';
import { SpotCard } from '@/components/SpotCard';
import { FilterBar } from '@/components/FilterBar';
import { SpotMap } from '@/components/Map';
import { CitySearch } from '@/components/CitySearch';
import { MapPin, Loader2, Navigation } from 'lucide-react';

export function HomePageClient() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { location, radius, category, city, setCity, detectedCity, isLoading: locationLoading } = useMap();

  useEffect(() => {
    async function fetchSpots() {
      setLoading(true);
      try {
        const params: Parameters<typeof api.spots.list>[0] = {};
        
        if (location) {
          params.lat = location.lat;
          params.lon = location.lon;
          params.radius = radius;
        }
        
        if (category) {
          params.category = category;
        }
        
        if (city) {
          params.city = city;
        }

        const response = await api.spots.list(params) as SpotListResponse;
        setSpots(response.spots);
      } catch (error) {
        console.error('Failed to fetch spots:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!locationLoading) {
      fetchSpots();
    }
  }, [location, radius, category, city, locationLoading]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#12121a] border-b border-[#1f1f2e] px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39ff14] to-[#00f5ff] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                Найди свой <span className="text-[#39ff14]">спот</span>
              </h1>
              <p className="text-sm text-white/50">
                {city
                  ? `Споты в ${city}`
                  : locationLoading
                    ? 'Определяем местоположение...'
                    : detectedCity
                      ? `Споты рядом — ${detectedCity}`
                      : 'Споты рядом с тобой'}
              </p>
            </div>
            <div className="w-64">
              <CitySearch />
            </div>
          </div>
          {detectedCity && !city && (
            <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
              <Navigation className="w-3 h-3 text-[#39ff14]" />
              Твой город: <button onClick={() => setCity(detectedCity)} className="text-[#39ff14] hover:underline">{detectedCity}</button>
            </div>
          )}
          <FilterBar viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto">
          {loading || locationLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
            </div>
          ) : viewMode === 'map' ? (
            <div className="h-[calc(100vh-280px)] rounded-xl overflow-hidden">
              <SpotMap spots={spots} center={location ? [location.lat, location.lon] : undefined} />
            </div>
          ) : spots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MapPin className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-xl font-semibold text-white/60 mb-2">Спотов не найдено</h3>
              <p className="text-white/40">
                Попробуй изменить фильтры или расширить радиус поиска
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {spots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}