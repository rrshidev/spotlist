'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { MapPin, Upload, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const AddSpotMap = dynamic(
  () => import('@/components/Map').then((m) => m.AddSpotMap),
  { ssr: false }
);

const ITEMS = ['sup', 'skateboard', 'longboard', 'bike', 'rollerblades', 'scooter', 'surfboard', 'snowboard', 'ski', 'other'];

export function NewRentalPageClient() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [prices, setPrices] = useState('');
  const [telegram, setTelegram] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  function toggleItem(item: string) {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await api.uploads.upload(file);
        setMedia((prev) => [...prev, result.url]);
      }
    } catch {
      addToast(t('rentals.error'), 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!latitude || !longitude) {
      addToast(t('rentals.noLocation'), 'error');
      return;
    }
    if (!name.trim() || !city.trim()) {
      addToast(t('newSpot.requiredFields'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const contacts: Record<string, string> = {};
      if (telegram) contacts.telegram = telegram;
      if (phone) contacts.phone = phone;
      if (website) contacts.website = website;

      await api.rentals.create({
        name: name.trim(),
        description: description.trim() || undefined,
        latitude,
        longitude,
        address: address.trim() || undefined,
        city: city.trim(),
        items: selectedItems,
        prices: prices.trim() || undefined,
        contacts,
        media,
      });

      addToast(t('rentals.success'), 'success');
      router.push('/rentals');
    } catch {
      addToast(t('rentals.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">{t('rentals.add')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.name')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rentals.namePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('rentals.descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.city')} *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('rentals.cityPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.address')}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('rentals.addressPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.locationHint')}</label>
            <div className="h-64 rounded-xl overflow-hidden">
              <AddSpotMap
                onLocationSelect={(lat, lon) => {
                  setLatitude(lat);
                  setLongitude(lon);
                }}
              />
            </div>
            {latitude && longitude && (
              <p className="mt-2 text-xs text-white/40">
                <MapPin className="w-3 h-3 inline" /> {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.items')}</label>
            <div className="flex flex-wrap gap-2">
              {ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItem(item)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedItems.includes(item)
                      ? 'bg-[#00f5ff] text-black font-medium'
                      : 'bg-[#1f1f2e] text-white/70 hover:bg-[#2a2a3e]'
                  }`}
                >
                  {t('rentalItems.' + item)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.prices')}</label>
            <input
              type="text"
              value={prices}
              onChange={(e) => setPrices(e.target.value)}
              placeholder={t('rentals.pricesPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.contacts')}</label>
            <div className="space-y-3">
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder={t('rentals.telegram')}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('rentals.phone')}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t('rentals.website')}
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.photos')}</label>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white/70 cursor-pointer hover:border-[#00f5ff] transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">{uploading ? '...' : 'Загрузить фото'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {media.length > 0 && (
              <p className="mt-2 text-xs text-white/40">Загружено: {media.length} фото</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#00f5ff] text-black font-semibold hover:bg-[#00d4e0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('rentals.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
