import { query, queryOne } from '../config/database';
import { Event, EventSchedule, PaginatedResponse, Member } from '../types';
import { AppError } from '../middlewares/auth';

interface EventRow {
    id: string;
    title: string;
    description: string | null;
    start_date: Date;
    end_date: Date;
    location: string | null;
    calendar_id: string | null;
    google_event_id: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

interface EventScheduleRow {
    id: string;
    event_id: string;
    member_id: string;
    role: string;
    confirmed: boolean;
    created_at: Date;
    // Campos do JOIN com member
    member_name?: string;
    member_role?: string;
    member_phone?: string;
    member_avatar?: string;
}

function mapEventRowToEvent(row: EventRow): Event {
    return {
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        startDate: row.start_date,
        endDate: row.end_date,
        location: row.location || undefined,
        calendarId: row.calendar_id || undefined,
        googleEventId: row.google_event_id || undefined,
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapScheduleRowToSchedule(row: EventScheduleRow): EventSchedule & { member?: Partial<Member> } {
    return {
        id: row.id,
        eventId: row.event_id,
        memberId: row.member_id,
        role: row.role,
        confirmed: row.confirmed,
        createdAt: row.created_at,
        member: row.member_name ? {
            id: row.member_id,
            name: row.member_name,
            role: row.member_role,
            phone: row.member_phone || undefined,
            avatar: row.member_avatar || undefined,
        } : undefined,
    };
}

export interface CreateEventDTO {
    title: string;
    description?: string;
    startDate: Date | string;
    endDate: Date | string;
    location?: string;
    calendarId?: string;
}

export interface UpdateEventDTO {
    title?: string;
    description?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    location?: string;
    calendarId?: string;
}

export interface AddScheduleDTO {
    memberId: string;
    role: string;
}

export interface EventFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface EventWithSchedules extends Event {
    schedules: (EventSchedule & { member?: Partial<Member> })[];
}

export class EventService {
    async create(data: CreateEventDTO, userId: string): Promise<Event> {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (endDate < startDate) {
            throw new AppError('Data de término deve ser após a data de início', 400, 'INVALID_DATES');
        }

        const [event] = await query<EventRow>(
            `INSERT INTO events (title, description, start_date, end_date, location, calendar_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                data.title,
                data.description || null,
                startDate,
                endDate,
                data.location || null,
                data.calendarId || null,
                userId || null,
            ]
        );

        return mapEventRowToEvent(event);
    }

    async findAll(filters: EventFilters = {}): Promise<PaginatedResponse<EventWithSchedules>> {
        const { search, startDate, endDate, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (startDate) {
            whereClause += ` AND start_date >= $${paramIndex}`;
            params.push(new Date(startDate));
            paramIndex++;
        }

        if (endDate) {
            whereClause += ` AND end_date <= $${paramIndex}`;
            params.push(new Date(endDate));
            paramIndex++;
        }

        // Contar total
        const [countResult] = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM events ${whereClause}`,
            params
        );
        const total = parseInt(countResult.count);

        // Buscar eventos
        const events = await query<EventRow>(
            `SELECT * FROM events ${whereClause}
       ORDER BY start_date ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        // Buscar escalas para cada evento
        const eventsWithSchedules: EventWithSchedules[] = await Promise.all(
            events.map(async (event) => {
                const schedules = await this.getSchedules(event.id);
                return {
                    ...mapEventRowToEvent(event),
                    schedules,
                };
            })
        );

        return {
            data: eventsWithSchedules,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string): Promise<EventWithSchedules> {
        const event = await queryOne<EventRow>(
            'SELECT * FROM events WHERE id = $1',
            [id]
        );

        if (!event) {
            throw new AppError('Evento não encontrado', 404, 'EVENT_NOT_FOUND');
        }

        const schedules = await this.getSchedules(id);

        return {
            ...mapEventRowToEvent(event),
            schedules,
        };
    }

    async findUpcoming(limit: number = 5): Promise<EventWithSchedules[]> {
        const events = await query<EventRow>(
            `SELECT * FROM events 
       WHERE start_date >= NOW()
       ORDER BY start_date ASC
       LIMIT $1`,
            [limit]
        );

        return Promise.all(
            events.map(async (event) => {
                const schedules = await this.getSchedules(event.id);
                return {
                    ...mapEventRowToEvent(event),
                    schedules,
                };
            })
        );
    }

    async update(id: string, data: UpdateEventDTO): Promise<Event> {
        // Verificar se o evento existe
        await this.findById(id);

        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            if (endDate < startDate) {
                throw new AppError('Data de término deve ser após a data de início', 400, 'INVALID_DATES');
            }
        }

        // Montar query de update dinâmica
        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description || null);
        }
        if (data.startDate !== undefined) {
            updates.push(`start_date = $${paramIndex++}`);
            params.push(new Date(data.startDate));
        }
        if (data.endDate !== undefined) {
            updates.push(`end_date = $${paramIndex++}`);
            params.push(new Date(data.endDate));
        }
        if (data.location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            params.push(data.location || null);
        }
        if (data.calendarId !== undefined) {
            updates.push(`calendar_id = $${paramIndex++}`);
            params.push(data.calendarId || null);
        }

        if (updates.length === 0) {
            const event = await this.findById(id);
            return event;
        }

        params.push(id);
        const [event] = await query<EventRow>(
            `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        return mapEventRowToEvent(event);
    }

    async delete(id: string): Promise<void> {
        // Verificar se o evento existe
        await this.findById(id);

        // Escalas são deletadas automaticamente (CASCADE)
        await query('DELETE FROM events WHERE id = $1', [id]);
    }

    // ========================================
    // ESCALAS
    // ========================================

    async getSchedules(eventId: string): Promise<(EventSchedule & { member?: Partial<Member> })[]> {
        const schedules = await query<EventScheduleRow>(
            `SELECT 
        es.*,
        m.name as member_name,
        m.role as member_role,
        m.phone as member_phone,
        m.avatar as member_avatar
       FROM event_schedules es
       LEFT JOIN members m ON es.member_id = m.id
       WHERE es.event_id = $1
       ORDER BY es.role ASC`,
            [eventId]
        );

        return schedules.map(mapScheduleRowToSchedule);
    }

    async addSchedule(eventId: string, data: AddScheduleDTO): Promise<EventSchedule> {
        // Verificar se o evento existe
        await this.findById(eventId);

        // Verificar se o membro já está na escala para esta função
        const existing = await queryOne<EventScheduleRow>(
            'SELECT id FROM event_schedules WHERE event_id = $1 AND member_id = $2 AND role = $3',
            [eventId, data.memberId, data.role]
        );

        if (existing) {
            throw new AppError('Membro já está escalado para esta função neste evento', 400, 'ALREADY_SCHEDULED');
        }

        const [schedule] = await query<EventScheduleRow>(
            `INSERT INTO event_schedules (event_id, member_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [eventId, data.memberId, data.role]
        );

        return mapScheduleRowToSchedule(schedule);
    }

    async updateScheduleConfirmation(scheduleId: string, confirmed: boolean): Promise<EventSchedule> {
        const [schedule] = await query<EventScheduleRow>(
            `UPDATE event_schedules SET confirmed = $1 WHERE id = $2 RETURNING *`,
            [confirmed, scheduleId]
        );

        if (!schedule) {
            throw new AppError('Escala não encontrada', 404, 'SCHEDULE_NOT_FOUND');
        }

        return mapScheduleRowToSchedule(schedule);
    }

    async removeSchedule(scheduleId: string): Promise<void> {
        const result = await query(
            'DELETE FROM event_schedules WHERE id = $1 RETURNING id',
            [scheduleId]
        );

        if (result.length === 0) {
            throw new AppError('Escala não encontrada', 404, 'SCHEDULE_NOT_FOUND');
        }
    }

    async getSchedulesByMember(memberId: string): Promise<(EventSchedule & { event?: Event })[]> {
        const schedules = await query<EventScheduleRow & EventRow>(
            `SELECT 
        es.*,
        e.title, e.description, e.start_date, e.end_date, e.location
       FROM event_schedules es
       LEFT JOIN events e ON es.event_id = e.id
       WHERE es.member_id = $1
       ORDER BY e.start_date ASC`,
            [memberId]
        );

        return schedules.map((row) => ({
            ...mapScheduleRowToSchedule(row),
            event: row.title ? mapEventRowToEvent(row as unknown as EventRow) : undefined,
        }));
    }
}

export const eventService = new EventService();
