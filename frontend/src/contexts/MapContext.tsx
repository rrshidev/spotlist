'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';

interface Location {
  lat: number;
  lon: number;
}

interface MapContextType {
  location: Location | null;
  setLocation: (location: Location | null) => void;
  radius: number;
  setRadius: (radius: number) => void;
  category: string;
  setCategory: (category: string) => void;
  city: string;
  setCity: (city: string) => void;
  obstacleType: string;
  setObstacleType: (t: string) => void;
  stairCount: string;
  setStairCount: (c: string) => void;
  rideType: string;
  setRideType: (t: string) => void;
  detectedCity: string;
  setDetectedCity: (city: string) => void;
  isLoading: boolean;
  error: string | null;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [location, setLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [obstacleType, setObstacleType] = useState('');
  const [stairCount, setStairCount] = useState('');
  const [rideType, setRideType] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation({ lat, lon });
        setIsLoading(false);
        
        try {
          const data = await api.geo.reverse(lat, lon) as { city: string };
          if (data.city) {
            setDetectedCity(data.city);
          }
        } catch (e) {
          console.log('Could not detect city');
        }
      },
      (err) => {
        setError(t('common.geoError'));
        setIsLoading(false);
      }
    );
  }, []);

  return (
    <MapContext.Provider value={{
      location,
      setLocation,
      radius,
      setRadius,
      category,
      setCategory,
      city,
      setCity,
      obstacleType,
      setObstacleType,
      stairCount,
      setStairCount,
      rideType,
      setRideType,
      detectedCity,
      setDetectedCity,
      isLoading,
      error,
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}