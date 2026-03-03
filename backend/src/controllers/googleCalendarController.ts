import { Request, Response } from 'express';
import { googleCalendarService } from '../services/googleCalendarService';
import { env } from '../config/env';

export class GoogleCalendarController {
    // Retorna URL para autenticação OAuth (somente admin)
    async getAuthUrl(req: Request, res: Response) {
        const userId = req.user!.userId;
        const url = googleCalendarService.getAuthUrl(userId);
        res.json({ url });
    }

    // Callback do OAuth - recebe o código e salva os tokens globalmente
    async callback(req: Request, res: Response) {
        const { code, state } = req.query;

        if (!code || typeof code !== 'string') {
            return res.redirect(`${env.FRONTEND_ORIGIN}/#/settings?error=missing_code`);
        }

        if (!state || typeof state !== 'string') {
            return res.redirect(`${env.FRONTEND_ORIGIN}/#/settings?error=missing_state`);
        }

        let adminUserId: string;
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            adminUserId = stateData.userId;
            if (!adminUserId) throw new Error('userId ausente no state');
        } catch {
            return res.redirect(`${env.FRONTEND_ORIGIN}/#/settings?error=invalid_state`);
        }

        try {
            await googleCalendarService.handleCallback(code, adminUserId);
            res.redirect(`${env.FRONTEND_ORIGIN}/#/settings?google=connected`);
        } catch (error) {
            console.error('Erro no callback Google OAuth:', error);
            res.redirect(`${env.FRONTEND_ORIGIN}/#/settings?error=google_auth_failed`);
        }
    }

    // Verifica status da conexão global do Google Calendar
    async status(req: Request, res: Response) {
        const info = await googleCalendarService.getConnectionInfo();
        res.json(info);
    }

    // Desconecta do Google Calendar (somente admin)
    async disconnect(req: Request, res: Response) {
        await googleCalendarService.disconnect();
        res.json({ message: 'Desconectado do Google Calendar' });
    }

    // Lista próximos eventos do Google Calendar (todos os membros)
    async listEvents(req: Request, res: Response) {
        const maxResults = parseInt(req.query.limit as string) || 10;
        const events = await googleCalendarService.listUpcomingEvents(maxResults);

        res.json({
            events: events.map((e) => ({
                id: e.id,
                title: e.summary,
                description: e.description,
                start: e.start?.dateTime || e.start?.date,
                end: e.end?.dateTime || e.end?.date,
                location: e.location,
                link: e.htmlLink,
            })),
        });
    }

    // Lista eventos de um mês (todos os membros)
    async monthEvents(req: Request, res: Response) {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

        try {
            const events = await googleCalendarService.listMonthEvents(year, month);

            res.json({
                year,
                month,
                total: events.length,
                events: events.map((e) => ({
                    id: e.id,
                    title: e.summary,
                    start: e.start?.dateTime || e.start?.date,
                    end: e.end?.dateTime || e.end?.date,
                })),
            });
        } catch (error: any) {
            if (error.statusCode === 401 || error.code === 'GOOGLE_NOT_CONNECTED') {
                return res.status(401).json({ error: 'GOOGLE_NOT_CONNECTED', total: 0 });
            }
            throw error;
        }
    }

    // Sincroniza um evento local com Google Calendar (admin)
    async syncEvent(req: Request, res: Response) {
        const { eventId } = req.params;
        const googleEventId = await googleCalendarService.syncEventToGoogle(eventId);

        res.json({
            message: 'Evento sincronizado com Google Calendar',
            googleEventId,
        });
    }

    // Remove um evento do Google Calendar (admin)
    async unsyncEvent(req: Request, res: Response) {
        const { eventId } = req.params;
        await googleCalendarService.unsyncEventFromGoogle(eventId);

        res.json({ message: 'Evento removido do Google Calendar' });
    }

    // Criar evento diretamente no Google Calendar
    async createGoogleEvent(req: Request, res: Response) {
        const { title, description, date, startTime, endTime } = req.body;

        if (!title || !date) {
            return res.status(400).json({ error: 'title e date são obrigatórios' });
        }

        const startDate = new Date(`${date}T${startTime || '09:00'}:00`);
        const endDate = new Date(`${date}T${endTime || '10:00'}:00`);

        try {
            const event = await googleCalendarService.createEvent({
                title,
                description,
                startDate,
                endDate,
            });

            res.status(201).json({
                event: {
                    id: event.id,
                    title: event.summary,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                },
            });
        } catch (error: any) {
            console.error('Erro ao criar evento no Google Calendar:', error);
            res.status(500).json({ error: 'Falha ao criar evento no Google Calendar' });
        }
    }

    // Atualizar evento diretamente no Google Calendar
    async updateGoogleEvent(req: Request, res: Response) {
        const { id } = req.params;
        const { title, description, date, startTime, endTime } = req.body;

        const updateData: { title?: string; description?: string; startDate?: Date; endDate?: Date } = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (date) {
            updateData.startDate = new Date(`${date}T${startTime || '09:00'}:00`);
            updateData.endDate = new Date(`${date}T${endTime || '10:00'}:00`);
        }

        try {
            const event = await googleCalendarService.updateEvent(id, updateData);

            res.json({
                event: {
                    id: event.id,
                    title: event.summary,
                    start: event.start?.dateTime || event.start?.date,
                    end: event.end?.dateTime || event.end?.date,
                },
            });
        } catch (error: any) {
            console.error('Erro ao atualizar evento no Google Calendar:', error);
            res.status(500).json({ error: 'Falha ao atualizar evento no Google Calendar' });
        }
    }

    // Deletar evento diretamente do Google Calendar
    async deleteGoogleEvent(req: Request, res: Response) {
        const { id } = req.params;

        try {
            await googleCalendarService.deleteEvent(id);
            res.json({ message: 'Evento removido do Google Calendar' });
        } catch (error: any) {
            console.error('Erro ao deletar evento do Google Calendar:', error);
            res.status(500).json({ error: 'Falha ao remover evento do Google Calendar' });
        }
    }
}

export const googleCalendarController = new GoogleCalendarController();
