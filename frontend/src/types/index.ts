export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  avatar: string | null;
  city: string | null;
  skating_style: string | null;
  bio: string | null;
}

export interface ObstacleItem {
  type: string;
  count?: number | null;
}

export interface Spot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  category: 'park' | 'street' | 'roller' | 'routes';
  obstacles: ObstacleItem[];
  media: string[];
  screenshot: string | null;
  video: string | null;
  status: string;
  last_status_at: string | null;
  author_id: string;
  author_username: string | null;
  author_avatar: string | null;
  is_checked: boolean;
  likes_count: number;
  liked: boolean;
  created_at: string;
  distance?: number;
}

export interface SpotListResponse {
  spots: Spot[];
  total: number;
  page: number;
  page_size: number;
}

export interface Comment {
  id: string;
  spot_id: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  content: string;
  parent_id: string | null;
  is_reported: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AdminStats {
  total_users: number;
  total_spots: number;
  unchecked_spots: number;
  total_comments: number;
  reported_comments: number;
}

export interface GeoLocation {
  city: string;
  address: string;
  lat: number;
  lon: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}