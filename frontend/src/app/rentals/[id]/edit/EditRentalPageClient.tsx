'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { Rental } from '@/types';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';

const ITEMS = ['sup', 'skateboard', 'longboard', 'bike', 'rollerblades', 'scooter', 'surfboard', 'snowboard', 'ski', 'other'];

export function EditRentalPageClient() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [prices, setPrices] = useState('');
  const [telegram, setTelegram] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    api.rentals.get(id).then((r) => {
      if (user?.id !== r.owner_id) {
        router.push(`/rentals/${id}`);
        return;
      }
      setRental(r);
      setName(r.name);
      setDescription(r.description || '');
      setCity(r.city);
      setAddress(r.address || '');
      setSelectedItems(r.items || []);
      setPrices(r.prices || '');
      setTelegram(r.contacts?.telegram || '');
      setPhone(r.contacts?.phone || '');
      setWebsite(r.contacts?.website || '');
      setLoading(false);
    }).catch(() => {
      router.push('/rentals');
    });
  }, [id, user, router]);

  function toggleItem(item: string) {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const contacts: Record<string, string> = {};
      if (telegram) contacts.telegram = telegram;
      if (phone) contacts.phone = phone;
      if (website) contacts.website = website;

      await api.rentals.update(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim(),
        items: selectedItems,
        prices: prices.trim() || undefined,
        contacts,
      });

      addToast(t('rentals.updated'), 'success');
      router.push(`/rentals/${id}`);
    } catch {
      addToast(t('rentals.error'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f5ff]" />
      </div>
    );
  }

  if (!rental) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/rentals/${id}`}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('editSpot.back')}
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">{t('rentals.edit')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.name')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">{t('rentals.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                className="w-full px-4 py-3 rounded-xl bg-[#1f1f2e] border border-[#2a2a3e] text-white placeholder-white/30 focus:outline-none focus:border-[#00f5ff]"
              />
            </div>
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#00f5ff] text-black font-semibold hover:bg-[#00d4e0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('editSpot.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
