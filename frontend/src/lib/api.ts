import { SpotListResponse, RentalListResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: { email: string; username: string; password: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: new URLSearchParams({ username: data.email, password: data.password }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    me: () => request('/auth/me'),
    update: (data: { username?: string; avatar?: string; city?: string; skating_style?: string; bio?: string }) =>
      request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  },

  spots: {
    list: (params?: { lat?: number; lon?: number; radius?: number; category?: string; city?: string; obstacle_type?: string; stair_count?: number; ride_type?: string; page?: number }) => {
      const searchParams = new URLSearchParams();
      
      if (params?.lat) searchParams.set('lat', params.lat.toString());
      if (params?.lon) searchParams.set('lon', params.lon.toString());
      if (params?.radius) searchParams.set('radius', params.radius.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.city) searchParams.set('city', params.city);
      if (params?.obstacle_type) searchParams.set('obstacle_type', params.obstacle_type);
      if (params?.stair_count) searchParams.set('stair_count', params.stair_count.toString());
      if (params?.ride_type) searchParams.set('ride_type', params.ride_type);
      if (params?.page) searchParams.set('page', params.page.toString());
      searchParams.set('with_liked', 'true');
      
      return request<SpotListResponse>(`/spots?${searchParams.toString()}`);
    },
    my: () => request('/spots/my'),
    get: (id: string) => request(`/spots/${id}`),
    create: (data: {
      name: string;
      description?: string;
      latitude: number;
      longitude: number;
      address?: string;
      city: string;
      category: string;
      media?: string[];
      screenshot?: string;
      video?: string;
      status?: string;
      obstacles?: { type: string; count?: number | null }[];
      ride_types?: string[];
    }) => request('/spots', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{
      name: string;
      description: string;
      address: string;
      city: string;
      category: string;
      latitude: number;
      longitude: number;
      media: string[];
      screenshot: string;
      video: string;
      obstacles: { type: string; count?: number | null }[];
      ride_types?: string[];
    }>) => request(`/spots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/spots/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) =>
      request(`/spots/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  comments: {
    list: (spotId: string) => request(`/spots/${spotId}/comments`),
    create: (spotId: string, content: string, parentId?: string) =>
      request(`/spots/${spotId}/comments`, { method: 'POST', body: JSON.stringify({ content, parent_id: parentId }) }),
    update: (id: string, content: string) =>
      request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    delete: (id: string) => request(`/comments/${id}`, { method: 'DELETE' }),
    report: (id: string, reason: string) =>
      request(`/comments/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },

  geo: {
    reverse: (lat: number, lon: number) =>
      request<{ city: string; address: string; lat: number; lon: number }>(`/geo/reverse?lat=${lat}&lon=${lon}`),
    search: (query: string) =>
      request<{ city: string; display_name: string; lat: number; lon: number }[]>(`/geo/search?q=${encodeURIComponent(query)}`),
  },

  admin: {
    stats: () => request('/admin/stats'),
    users: () => request('/admin/users'),
    toggleBan: (userId: string) => request(`/admin/users/${userId}/ban`, { method: 'PATCH' }),
    spots: () => request('/admin/spots'),
    approveSpot: (spotId: string) => request(`/admin/spots/${spotId}/check`, { method: 'PATCH' }),
    deleteSpot: (spotId: string) => request(`/admin/spots/${spotId}`, { method: 'DELETE' }),
    reports: () => request('/admin/reports'),
    ignoreReport: (commentId: string) => request(`/admin/comments/${commentId}/ignore-report`, { method: 'PATCH' }),
  },

  likes: {
    toggle: (spotId: string) => request(`/likes/${spotId}`, { method: 'POST' }),
    check: (spotId: string) => request(`/likes/spot/${spotId}`),
    list: () => request('/likes'),
    toggleComment: (commentId: string) => request(`/likes/comment/${commentId}`, { method: 'POST' }),
    checkComment: (commentId: string) => request(`/likes/comment/${commentId}`),
  },

  uploads: {
    upload: async (file: File) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  },

  wishlist: {
    toggle: (spotId: string) => request<{ saved: boolean }>(`/wishlist/${spotId}`, { method: 'POST' }),
    list: () => request<{ id: string; spot_id: string; spot_name: string; city: string; category: string; media: string[]; latitude: number; longitude: number; created_at: string }[]>('/wishlist'),
    check: (spotId: string) => request<{ saved: boolean }>(`/wishlist/check/${spotId}`),
  },

  rentals: {
    list: (params?: { city?: string; item_type?: string; lat?: number; lon?: number; radius?: number; page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.city) searchParams.set('city', params.city);
      if (params?.item_type) searchParams.set('item_type', params.item_type);
      if (params?.lat) searchParams.set('lat', params.lat.toString());
      if (params?.lon) searchParams.set('lon', params.lon.toString());
      if (params?.radius) searchParams.set('radius', params.radius.toString());
      if (params?.page) searchParams.set('page', params.page.toString());
      return request<RentalListResponse>(`/rentals?${searchParams.toString()}`);
    },
    my: () => request('/rentals/my'),
    get: (id: string) => request(`/rentals/${id}`),
    create: (data: {
      name: string;
      description?: string;
      latitude: number;
      longitude: number;
      address?: string;
      city: string;
      items?: string[];
      prices?: string;
      contacts?: Record<string, string>;
      media?: string[];
    }) => request('/rentals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{
      name: string;
      description: string;
      address: string;
      city: string;
      latitude: number;
      longitude: number;
      items: string[];
      prices: string;
      contacts: Record<string, string>;
      media: string[];
    }>) => request(`/rentals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/rentals/${id}`, { method: 'DELETE' }),
  },

  telegram: {
    login: (data: Record<string, unknown>) =>
      request<{ access_token: string; token_type: string }>('/auth/telegram', { method: 'POST', body: JSON.stringify(data) }),
    link: (data: Record<string, unknown>) =>
      request<{ status: string; telegram_username: string }>('/auth/telegram/link', { method: 'POST', body: JSON.stringify(data) }),
    unlink: () =>
      request<{ status: string }>('/auth/telegram/link', { method: 'DELETE' }),
  },
};

export function saveToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}