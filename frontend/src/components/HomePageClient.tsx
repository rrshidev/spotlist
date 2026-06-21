'use client';

import { useState, useEffect } from 'react';
import { useMap } from '@/contexts/MapContext';
import { api } from '@/lib/api';
import { Spot, SpotListResponse } from '@/types';
import { SpotCard } from '@/components/SpotCard';
import { FilterBar } from '@/components/FilterBar';
import { useI18n } from '@/contexts/I18nContext';
import { SpotMap } from '@/components/Map';
import { CitySearch } from '@/components/CitySearch';
import { MapPin, Loader2, Navigation } from 'lucide-react';

export function HomePageClient() {
  const { t } = useI18n();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { location, radius, category, city, obstacleType, stairCount, rideType, setCity, detectedCity, isLoading: locationLoading } = useMap();
  const hasFilter = !!(city || detectedCity || location);

  useEffect(() => {
    api.spots.count().then(r => setTotalCount(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    async function fetchSpots() {
      setLoading(true);
      try {
        const params: Parameters<typeof api.spots.list>[0] = {};

        if (city) {
          params.city = city;
        } else if (detectedCity) {
          params.city = detectedCity;
        } else if (location) {
          params.lat = location.lat;
          params.lon = location.lon;
          params.radius = radius;
        }

        if (category) {
          params.category = category;
        }

        if (obstacleType) {
          params.obstacle_type = obstacleType;
        }

        if (stairCount) {
          params.stair_count = parseInt(stairCount, 10);
        }

        if (rideType) {
          params.ride_type = rideType;
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
  }, [location, radius, category, city, detectedCity, rideType, locationLoading]);

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
                {t('home.hero')} <span className="text-[#39ff14]">спот</span>
              </h1>
              <p className="text-sm text-white/50">
                {locationLoading
                  ? t('home.detecting')
                  : city
                    ? `${t('home.spotsIn')} ${city}`
                    : detectedCity
                      ? `${t('home.spotsNear')} ${detectedCity}`
                      : t('home.hint')}
              </p>
            </div>
            <div className="w-64">
              <CitySearch />
            </div>
          </div>
          {!city && !detectedCity && !location && totalCount > 0 && (
            <div className="mb-4 text-sm text-white/40">
              {t('home.totalSpots', { count: totalCount })}
            </div>
          )}
          {detectedCity && (
            <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
              <Navigation className="w-4 h-4 text-[#39ff14]" />
              <span>{t('home.yourCity')} <strong className="text-white">{detectedCity}</strong></span>
              {city !== detectedCity && (
                <button onClick={() => setCity(detectedCity)} className="ml-2 px-2 py-0.5 rounded bg-[#39ff14]/20 text-[#39ff14] text-xs hover:bg-[#39ff14]/30 transition-colors">
                  {t('home.showSpots')}
                </button>
              )}
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
              <h3 className="text-xl font-semibold text-white/60 mb-2">
                {t('home.notFound')}
              </h3>
              <p className="text-white/40">
                {t('home.changeFilters')}
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