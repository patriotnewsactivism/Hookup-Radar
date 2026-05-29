// Base44 SDK integration for entities (profiles, messages, reports)
const APP_ID = import.meta.env.VITE_BASE44_APP_ID || '';
const BASE_URL = `https://${APP_ID}.base44.app`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('surge_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  users: {
    list: (query?: Record<string, unknown>) =>
      apiFetch('/api/entities/SurgeUser?' + new URLSearchParams(query as Record<string, string>).toString()),
    get: (id: string) => apiFetch(`/api/entities/SurgeUser/${id}`),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/entities/SurgeUser', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/entities/SurgeUser/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  messages: {
    list: (query?: Record<string, unknown>) =>
      apiFetch('/api/entities/SurgeMessage?' + new URLSearchParams(query as Record<string, string>).toString()),
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/entities/SurgeMessage', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch(`/api/entities/SurgeMessage/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  reports: {
    create: (data: Record<string, unknown>) =>
      apiFetch('/api/entities/SurgeReport', { method: 'POST', body: JSON.stringify(data) }),
  },
};
