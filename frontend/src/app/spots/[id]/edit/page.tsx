'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { AddSpotMap } from '@/components/Map';
import { api } from '@/lib/api';
import { Spot } from '@/types';
import { MapPin, Loader2, Upload, X, ArrowLeft } from 'lucide-react';

const categories = [
  { value: 'park', label: 'Парк' },
  { value: 'street', label: 'Стрит' },
  { value: 'roller', label: 'Роллер-дром' },
  { value: 'routes', label: 'Маршруты' },
];

export default function EditSpotPage() {
  const params = useParams();
  const router = useRouter();
  const spotId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('street');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchSpot() {
      try {
        const spot = await api.spots.get(spotId) as Spot;
        if (spot.author_id !== user?.id && user?.role !== 'admin') {
          router.push('/');
          return;
        }
        setName(spot.name);
        setDescription(spot.description || '');
        setAddress(spot.address || '');
        setCity(spot.city);
        setCategory(spot.category);
        setLatitude(spot.latitude);
        setLongitude(spot.longitude);
        setMedia(spot.media || []);
      } catch {
        addToast('Спот не найден', 'error');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchSpot();
    }
  }, [spotId, user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(file => api.uploads.upload(file))
      );
      const newUrls = urls.map((r: any) => r.url);
      setMedia([...media, ...newUrls]);
    } catch {
      addToast('Ошибка загрузки', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !city.trim() || !latitude || !longitude) {
      addToast('Заполните обязательные поля', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.spots.update(spotId, {
        name,
        description,
        address,
        city,
        category,
        latitude,
        longitude,
        media,
      });
      addToast('Спот обновлён', 'success');
      router.push(`/spots/${spotId}`);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/spots/${spotId}`)}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к споту
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">Редактирование спота</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Название *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Город *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Категория *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white"
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Адрес</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Местоположение (кликните на карте) *</label>
            <div className="h-64 rounded-xl overflow-hidden border border-[#1f1f2e]">
              <AddSpotMap 
                center={latitude && longitude ? [latitude, longitude] : undefined}
                onLocationChange={(lat, lon) => {
                  setLatitude(lat);
                  setLongitude(lon);
                }}
              />
            </div>
            {!latitude && (
              <p className="text-xs text-yellow-400 mt-1">Выберите место на карте</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Фотографии</label>
            <div className="grid grid-cols-3 gap-2">
              {media.map((url, i) => (
                <div key={i} className="relative">
                  <img src={getAvatarUrl(url)} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={() => setMedia(media.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex items-center justify-center h-24 border-2 border-dashed border-[#1f1f2e] rounded-lg cursor-pointer hover:border-[#39ff14] transition-colors">
                <Upload className="w-6 h-6 text-white/40" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#39ff14] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getAvatarUrl(avatar: string): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  if (avatar.startsWith('http')) return avatar;
  return API_URL.replace('/api/v1', '') + avatar;
}