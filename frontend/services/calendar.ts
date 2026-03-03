import { supabase } from './supabase';

export type EventData = {
  title: string;
  date: string | null;
  attendees: string[];
};

export type MonthEventsData = {
  total: number;
  events: { id: string; title: string; start: string; end: string }[];
};

/**
 * Helper para obter headers autenticados com token Supabase
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export async function fetchUpcomingEvent(): Promise<{ event?: EventData | null; unauthorized?: boolean; authUrl?: string }> {
  const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
  try {
    const headers = await getAuthHeaders();
    // Usa o endpoint do Google Calendar para buscar o próximo evento
    const url = `${BASE}/api/google-calendar/events?limit=1`;
    const res = await fetch(url, { headers });
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      console.warn('fetchUpcomingEvent: unauthorized', data);
      return { unauthorized: true, authUrl: data.authUrl };
    }
    if (!res.ok) {
      return { event: null };
    }
    const data = await res.json();
    const events = data.events || [];
    if (events.length === 0) return { event: null };

    // Formatar o evento do Google Calendar para o formato EventData
    const e = events[0];
    const startDate = e.start ? new Date(e.start).toLocaleDateString('pt-BR') : null;
    return {
      event: {
        title: e.title || 'Sem título',
        date: startDate,
        attendees: []
      }
    };
  } catch (err) {
    console.error('fetchUpcomingEvent error', err);
    return { event: null };
  }
}

export async function fetchMonthEventsCount(year: number, month: number): Promise<MonthEventsData> {
  const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
  try {
    const headers = await getAuthHeaders();
    const url = `${BASE}/api/google-calendar/month-events?year=${year}&month=${month}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn('fetchMonthEventsCount: response', res.status);
      return { total: 0, events: [] };
    }
    const data = await res.json();
    return { total: data.total || 0, events: data.events || [] };
  } catch (err) {
    console.error('fetchMonthEventsCount error', err);
    return { total: 0, events: [] };
  }
}
