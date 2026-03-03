import { CalendarEvent } from '../types';

const BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000') + '/api/events-public';

export async function fetchEvents(): Promise<CalendarEvent[]> {
    try {
        const res = await fetch(BASE_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.events || [];
    } catch (err) {
        console.error('fetchEvents error', err);
        return [];
    }
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.event;
    } catch (err) {
        console.error('createEvent error', err);
        return null;
    }
}

export async function updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.event;
    } catch (err) {
        console.error('updateEvent error', err);
        return null;
    }
}

export async function deleteEvent(id: string): Promise<boolean> {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (err) {
        console.error('deleteEvent error', err);
        return false;
    }
}
