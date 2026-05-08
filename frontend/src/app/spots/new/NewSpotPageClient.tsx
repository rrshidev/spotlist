'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMap } from '@/contexts/MapContext';
import { AddSpotMap } from '@/components/Map';
import { api } from '@/lib/api';
import { MapPin, Loader2, Upload, X } from 'lucide-react';

const categories = [
  { value: 'park', label: 'Парк' },
  { value: 'street', label: 'Стрит' },
  { value: 'roller', label: 'Роллер-дром' },
  { value: 'routes', label: 'Маршруты' },
];

export default function NewSpotPageClient() {
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
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { location } = useMap();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (location) {
      setLatitude(location.lat);
      setLongitude(location.lon);
      fetchCity(location.lat, location.lon);
    }
  }, [location]);

  const fetchCity = async (lat: number, lon: number) => {
    try {
      const data = await api.geo.reverse(lat, lon) as { city: string };
      setCity(data.city);
    } catch {
      setCity('');
    }
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    fetchCity(lat, lon);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await api.uploads.upload(file) as { url: string };
        urls.push(result.url);
      }
      setMedia([...media, ...urls]);
      addToast('Фото загружены', 'success');
    } catch {
      addToast('Ошибка загрузки', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      addToast('Укажите местоположение на карте', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.spots.create({
        name,
        description,
        latitude,
        longitude,
        address,
        city,
        category,
        media,
      });
      addToast('Спот успешно добавлен!', 'success');
      router.push('/');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Ошибка создания спота', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#39ff14] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#12121a] border border-[#1f1f2e] rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Добавить спот</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Название</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none"
                    placeholder="Скейт-парк Центральный"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Описание</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none resize-none h-32"
                    placeholder="Опиши спот..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Категория</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          category === cat.value
                            ? 'bg-[#39ff14] text-black'
                            : 'bg-[#1f1f2e] text-white/70 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Город</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none"
                    placeholder="Москва"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Адрес</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl text-white placeholder:text-white/40 focus:border-[#39ff14] focus:outline-none"
                    placeholder="ул. Примерная, 1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Фото</label>
                  <div className="flex flex-wrap gap-2">
                    {media.map((url, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#1f1f2e] flex items-center justify-center cursor-pointer hover:border-[#39ff14] transition-colors">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-white/40" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Местоположение <span className="text-red-400">*</span>
                </label>
                <div className="rounded-xl overflow-hidden border border-[#1f1f2e]">
                  <AddSpotMap onLocationSelect={handleLocationSelect} center={location ? [location.lat, location.lon] : undefined} />
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {latitude && longitude
                    ? `Координаты: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    : 'Кликните на карту для выбора местоположения'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !latitude || !longitude}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#39ff14] to-[#00f5ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              Добавить спот
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}