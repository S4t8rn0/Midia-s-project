import { supabase } from './supabase';

const BASE = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/google-calendar';

/**
 * Headers autenticados com token Supabase
 */
async function authHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Não autenticado');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Verifica se o Google Calendar está conectado (retorna também o email)
 */
export async function getGoogleCalendarStatus(): Promise<{ connected: boolean; email?: string }> {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/status`, { headers });
        if (!res.ok) return { connected: false };
        return await res.json();
    } catch {
        return { connected: false };
    }
}

/**
 * Obtém a URL de autenticação do Google OAuth (somente admin)
 */
export async function getGoogleAuthUrl(): Promise<string | null> {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/auth-url`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        return data.url || null;
    } catch {
        return null;
    }
}

/**
 * Desconecta do Google Calendar (somente admin)
 */
export async function disconnectGoogleCalendar(): Promise<boolean> {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/disconnect`, {
            method: 'POST',
            headers,
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Lista eventos do Google Calendar (disponível para todos os membros)
 */
export async function listGoogleEvents(limit: number = 10) {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/events?limit=${limit}`, { headers });
        if (!res.ok) return [];
        const data = await res.json();
        return data.events || [];
    } catch {
        return [];
    }
}

/**
 * Lista eventos de um mês do Google Calendar (disponível para todos)
 */
export async function listGoogleMonthEvents(year: number, month: number) {
    try {
        const headers = await authHeaders();
        console.log(`[GCal] Buscando eventos ${year}-${month}...`);
        const res = await fetch(`${BASE}/month-events?year=${year}&month=${month}`, { headers });
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[GCal] Erro ${res.status} para ${year}-${month}:`, errorText);
            return { total: 0, events: [] };
        }
        const data = await res.json();
        console.log(`[GCal] Recebidos ${data.total || 0} eventos para ${year}-${month}`);
        return { total: data.total || 0, events: data.events || [] };
    } catch (err) {
        console.error(`[GCal] Exceção ao buscar ${year}-${month}:`, err);
        return { total: 0, events: [] };
    }
}

/**
 * Criar evento diretamente no Google Calendar
 */
export async function createGoogleEvent(data: { title: string; date: string; description?: string }) {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/events`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        const result = await res.json();
        return result.event;
    } catch {
        return null;
    }
}

/**
 * Atualizar evento no Google Calendar
 */
export async function updateGoogleEvent(id: string, data: { title?: string; date?: string; description?: string }) {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/events/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        const result = await res.json();
        return result.event;
    } catch {
        return null;
    }
}

/**
 * Deletar evento do Google Calendar
 */
export async function deleteGoogleEvent(id: string): Promise<boolean> {
    try {
        const headers = await authHeaders();
        const res = await fetch(`${BASE}/events/${id}`, {
            method: 'DELETE',
            headers,
        });
        return res.ok;
    } catch {
        return false;
    }
}
