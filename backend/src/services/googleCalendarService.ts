import { google, calendar_v3 } from 'googleapis';
import { env } from '../config/env';
import { query, queryOne } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/auth';

interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}

interface GoogleConfigRow {
    id: number;
    access_token: string;
    refresh_token: string | null;
    expiry_date: string | null;
    connected_by: string | null;
    connected_email: string | null;
    created_at: Date;
    updated_at: Date;
}

export class GoogleCalendarService {
    private oauth2Client;

    constructor() {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            logger.warn('Google Calendar API não configurada: faltam credenciais');
        }

        this.oauth2Client = new google.auth.OAuth2(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            env.GOOGLE_REDIRECT_URI
        );
    }

    // ========================================
    // AUTENTICAÇÃO OAUTH (Global - um admin conecta para todos)
    // ========================================

    getAuthUrl(adminUserId: string): string {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            throw new AppError('Google Calendar API não configurada', 500, 'GOOGLE_NOT_CONFIGURED');
        }

        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
        ];

        // Codifica o adminUserId no state para recuperar no callback
        const state = Buffer.from(JSON.stringify({ userId: adminUserId })).toString('base64');

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent select_account',
            state,
        });
    }

    async handleCallback(code: string, adminUserId: string): Promise<void> {
        const { tokens } = await this.oauth2Client.getToken(code);

        // Tentar pegar o email da conta conectada
        let email: string | null = null;
        try {
            this.oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            email = userInfo.data.email || null;
        } catch (err) {
            logger.warn('Não foi possível obter email da conta Google:', err);
        }

        await this.saveGlobalTokens(tokens as GoogleTokens, adminUserId, email);
    }

    // ========================================
    // TOKENS GLOBAIS (compartilhados por todos)
    // ========================================

    async saveGlobalTokens(tokens: GoogleTokens, adminUserId: string, email?: string | null): Promise<void> {
        const existing = await queryOne<GoogleConfigRow>(
            'SELECT id FROM google_calendar_config WHERE id = 1',
            []
        );

        if (existing) {
            await query(
                `UPDATE google_calendar_config 
                 SET access_token = $1, 
                     refresh_token = COALESCE($2, refresh_token), 
                     expiry_date = $3, 
                     connected_email = COALESCE($4, connected_email),
                     updated_at = NOW()
                 WHERE id = 1`,
                [
                    tokens.access_token,
                    tokens.refresh_token || null,
                    tokens.expiry_date?.toString() || null,
                    email || null,
                ]
            );
        } else {
            await query(
                `INSERT INTO google_calendar_config (id, access_token, refresh_token, expiry_date, connected_email)
                 VALUES (1, $1, $2, $3, $4)`,
                [
                    tokens.access_token,
                    tokens.refresh_token || null,
                    tokens.expiry_date?.toString() || null,
                    email || null,
                ]
            );
        }
    }

    async getGlobalTokens(): Promise<GoogleTokens | null> {
        const row = await queryOne<GoogleConfigRow>(
            'SELECT * FROM google_calendar_config WHERE id = 1',
            []
        );

        if (!row) return null;

        return {
            access_token: row.access_token,
            refresh_token: row.refresh_token || undefined,
            expiry_date: row.expiry_date ? parseInt(row.expiry_date) : undefined,
        };
    }

    async getGlobalConfig(): Promise<GoogleConfigRow | null> {
        return queryOne<GoogleConfigRow>(
            'SELECT * FROM google_calendar_config WHERE id = 1',
            []
        );
    }

    async getAuthenticatedClient() {
        const tokens = await this.getGlobalTokens();

        if (!tokens) {
            throw new AppError(
                'Google Calendar não conectado. Um administrador precisa conectar.',
                401,
                'GOOGLE_NOT_CONNECTED'
            );
        }

        this.oauth2Client.setCredentials(tokens);

        // Verificar se o token expirou e renovar se necessário
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            try {
                const { credentials } = await this.oauth2Client.refreshAccessToken();
                await this.saveGlobalTokens(
                    credentials as GoogleTokens,
                    '', // mantém o connected_by original
                    null
                );
                this.oauth2Client.setCredentials(credentials);
            } catch (error) {
                logger.error('Erro ao renovar token do Google:', error);
                throw new AppError(
                    'Token do Google expirado. Um admin precisa reconectar.',
                    401,
                    'GOOGLE_TOKEN_EXPIRED'
                );
            }
        }

        return google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    async isConnected(): Promise<boolean> {
        const tokens = await this.getGlobalTokens();
        return !!tokens;
    }

    async getConnectionInfo(): Promise<{ connected: boolean; email?: string }> {
        const config = await this.getGlobalConfig();
        return {
            connected: !!config,
            email: config?.connected_email || undefined,
        };
    }

    async disconnect(): Promise<void> {
        await query('DELETE FROM google_calendar_config WHERE id = 1', []);
    }

    // ========================================
    // OPERAÇÕES COM CALENDÁRIO (compartilhadas)
    // ========================================

    async listUpcomingEvents(maxResults: number = 10): Promise<calendar_v3.Schema$Event[]> {
        const calendar = await this.getAuthenticatedClient();

        const response = await calendar.events.list({
            calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
            timeMin: new Date().toISOString(),
            maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items || [];
    }

    async listMonthEvents(year: number, month: number): Promise<calendar_v3.Schema$Event[]> {
        const calendar = await this.getAuthenticatedClient();

        const timeMin = new Date(year, month - 1, 1);
        const timeMax = new Date(year, month, 1);

        const response = await calendar.events.list({
            calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
        });

        return response.data.items || [];
    }

    async createEvent(event: {
        title: string;
        description?: string;
        startDate: Date;
        endDate: Date;
        location?: string;
    }): Promise<calendar_v3.Schema$Event> {
        const calendar = await this.getAuthenticatedClient();

        const googleEvent: calendar_v3.Schema$Event = {
            summary: event.title,
            description: event.description,
            location: event.location,
            start: {
                dateTime: event.startDate.toISOString(),
                timeZone: 'America/Sao_Paulo',
            },
            end: {
                dateTime: event.endDate.toISOString(),
                timeZone: 'America/Sao_Paulo',
            },
        };

        const response = await calendar.events.insert({
            calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
            requestBody: googleEvent,
        });

        return response.data;
    }

    async updateEvent(
        googleEventId: string,
        event: {
            title?: string;
            description?: string;
            startDate?: Date;
            endDate?: Date;
            location?: string;
        }
    ): Promise<calendar_v3.Schema$Event> {
        const calendar = await this.getAuthenticatedClient();

        const googleEvent: calendar_v3.Schema$Event = {};

        if (event.title) googleEvent.summary = event.title;
        if (event.description !== undefined) googleEvent.description = event.description;
        if (event.location !== undefined) googleEvent.location = event.location;
        if (event.startDate) {
            googleEvent.start = {
                dateTime: event.startDate.toISOString(),
                timeZone: 'America/Sao_Paulo',
            };
        }
        if (event.endDate) {
            googleEvent.end = {
                dateTime: event.endDate.toISOString(),
                timeZone: 'America/Sao_Paulo',
            };
        }

        const response = await calendar.events.patch({
            calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
            eventId: googleEventId,
            requestBody: googleEvent,
        });

        return response.data;
    }

    async deleteEvent(googleEventId: string): Promise<void> {
        const calendar = await this.getAuthenticatedClient();

        await calendar.events.delete({
            calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
            eventId: googleEventId,
        });
    }

    async getEvent(googleEventId: string): Promise<calendar_v3.Schema$Event | null> {
        try {
            const calendar = await this.getAuthenticatedClient();

            const response = await calendar.events.get({
                calendarId: env.GOOGLE_CALENDAR_ID || 'primary',
                eventId: googleEventId,
            });

            return response.data;
        } catch (error) {
            return null;
        }
    }

    // ========================================
    // SINCRONIZAÇÃO COM EVENTOS LOCAIS
    // ========================================

    async syncEventToGoogle(eventId: string): Promise<string | null> {
        try {
            const [event] = await query<{
                id: string;
                title: string;
                description: string | null;
                start_date: Date;
                end_date: Date;
                location: string | null;
                google_event_id: string | null;
            }>(
                'SELECT * FROM events WHERE id = $1',
                [eventId]
            );

            if (!event) {
                throw new AppError('Evento não encontrado', 404, 'EVENT_NOT_FOUND');
            }

            let googleEventId = event.google_event_id;

            if (googleEventId) {
                await this.updateEvent(googleEventId, {
                    title: event.title,
                    description: event.description || undefined,
                    startDate: new Date(event.start_date),
                    endDate: new Date(event.end_date),
                    location: event.location || undefined,
                });
            } else {
                const googleEvent = await this.createEvent({
                    title: event.title,
                    description: event.description || undefined,
                    startDate: new Date(event.start_date),
                    endDate: new Date(event.end_date),
                    location: event.location || undefined,
                });

                googleEventId = googleEvent.id || null;

                if (googleEventId) {
                    await query(
                        'UPDATE events SET google_event_id = $1 WHERE id = $2',
                        [googleEventId, eventId]
                    );
                }
            }

            logger.info(`Evento ${eventId} sincronizado com Google Calendar: ${googleEventId}`);
            return googleEventId;
        } catch (error) {
            logger.error('Erro ao sincronizar evento com Google:', error);
            throw error;
        }
    }

    async unsyncEventFromGoogle(eventId: string): Promise<void> {
        const [event] = await query<{ google_event_id: string | null }>(
            'SELECT google_event_id FROM events WHERE id = $1',
            [eventId]
        );

        if (event?.google_event_id) {
            try {
                await this.deleteEvent(event.google_event_id);
            } catch (error) {
                logger.warn('Erro ao deletar evento do Google Calendar:', error);
            }

            await query(
                'UPDATE events SET google_event_id = NULL WHERE id = $1',
                [eventId]
            );
        }
    }
}

export const googleCalendarService = new GoogleCalendarService();
