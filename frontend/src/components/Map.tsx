'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { Spot } from '@/types';
import 'leaflet/dist/leaflet.css';

interface SpotMapProps {
  spots: Spot[];
  center?: [number, number];
  zoom?: number;
}

interface AddSpotMapProps {
  onLocationSelect: (lat: number, lon: number) => void;
  center?: [number, number];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return API_URL.replace('/api/v1', '') + url;
}

const categoryColors: Record<string, string> = {
  park: '#a855f7',
  street: '#22c55e',
  roller: '#3b82f6',
  routes: '#f97316',
};

function createSpotIcon(spot: Spot) {
  const hasPhoto = spot.media && spot.media.length > 0 && spot.media[0];
  const photoUrl = hasPhoto ? getMediaUrl(spot.media[0]) : '';
  const categoryColor = categoryColors[spot.category] || '#6b7280';
  const firstLetter = spot.name.charAt(0).toUpperCase();

  const html = `<div style="
    width:44px;height:44px;border-radius:50%;
    border:3px solid ${categoryColor};overflow:hidden;
    background:${photoUrl ? `url(${photoUrl}) center/cover` : categoryColor};
    display:flex;align-items:center;justify-content:center;
    font-size:18px;font-weight:bold;color:#fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4)
  ">${!photoUrl ? firstLetter : ''}</div>`;

  return divIcon({
    html,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -48],
  });
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function SpotMap({ spots, center = [55.7558, 37.6173], zoom = 13 }: SpotMapProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.latitude, spot.longitude]}
          icon={createSpotIcon(spot)}
        >
          <Popup>
            <div className="w-64">
              {spot.media && spot.media.length > 0 && spot.media[0] && (
                <div className="h-36 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-lg">
                  <img
                    src={getMediaUrl(spot.media[0])}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-bold text-white text-base mb-1">{spot.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  backgroundColor: categoryColors[spot.category] || '#6b7280',
                  color: '#fff',
                }}>
                  {t('categories.' + spot.category) || spot.category}
                </span>
                <span className="text-xs text-white/50">{spot.city}</span>
                {spot.distance && (
                  <span className="text-xs text-white/50">{spot.distance} {t('map.km')}</span>
                )}
              </div>
              {spot.description && (
                <p className="text-sm text-white/60 line-clamp-2 mb-3">{spot.description}</p>
              )}
              <button
                onClick={() => router.push(`/spots/${spot.id}`)}
                className="w-full py-2 rounded-lg text-sm font-semibold text-black transition-colors"
                style={{ backgroundColor: categoryColors[spot.category] || '#6b7280' }}
              >
                {t('map.details')}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function AddSpotMap({ onLocationSelect, center = [55.7558, 37.6173] }: AddSpotMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onLocationSelect} />
    </MapContainer>
  );
}