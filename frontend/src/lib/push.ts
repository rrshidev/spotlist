const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

export async function getVapidPublicKey(): Promise<string> {
  const response = await fetch(`${API_URL}/push/vapid-public-key`);
  if (!response.ok) throw new Error('Failed to get VAPID key');
  const data = await response.json();
  return data.public_key;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

export async function subscribeUser(): Promise<boolean> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    const publicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });

    const token = getToken();
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function unsubscribeUser(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    const token = getToken();
    const response = await fetch(`${API_URL}/push/unsubscribe`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function sendTestPush(): Promise<boolean> {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getPushPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}
