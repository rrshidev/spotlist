'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SaveButtonProps {
  spotId: string;
  initialSaved?: boolean;
  onToggle?: (saved: boolean) => void;
  size?: 'sm' | 'md';
}

export default function SaveButton({ spotId, initialSaved = false, onToggle, size = 'sm' }: SaveButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.wishlist.toggle(spotId);
      setSaved(res.saved);
      onToggle?.(res.saved);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClass} rounded-lg flex items-center justify-center transition-all ${
        saved
          ? 'bg-[#00f5ff]/20 text-[#00f5ff]'
          : 'bg-[#1f1f2e] text-white/40 hover:text-white/80 hover:bg-[#2a2a3e]'
      }`}
      title={saved ? 'Убрать из сохранённых' : 'Сохранить'}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
    </button>
  );
}
