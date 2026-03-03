import { Request, Response } from 'express';
import { z } from 'zod';
import { eventService } from '../services/eventService';

const createEventSchema = z.object({
    title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    startDate: z.string().datetime({ message: 'Data de início inválida' }),
    endDate: z.string().datetime({ message: 'Data de término inválida' }),
    location: z.string().optional(),
    calendarId: z.string().optional(),
});

const updateEventSchema = z.object({
    title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').optional(),
    description: z.string().optional(),
    startDate: z.string().datetime({ message: 'Data de início inválida' }).optional(),
    endDate: z.string().datetime({ message: 'Data de término inválida' }).optional(),
    location: z.string().optional(),
    calendarId: z.string().optional(),
});

const listEventsSchema = z.object({
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

const addScheduleSchema = z.object({
    memberId: z.string().uuid('ID do membro inválido'),
    role: z.string().min(1, 'Função é obrigatória'),
});

const updateScheduleSchema = z.object({
    confirmed: z.boolean(),
});

export class EventController {
    async create(req: Request, res: Response) {
        const data = createEventSchema.parse(req.body);
        const userId = req.user!.userId;

        const event = await eventService.create(data, userId);

        res.status(201).json({
            message: 'Evento criado com sucesso',
            event,
        });
    }

    async findAll(req: Request, res: Response) {
        const filters = listEventsSchema.parse(req.query);

        const result = await eventService.findAll(filters);

        res.json(result);
    }

    async findById(req: Request, res: Response) {
        const { id } = req.params;

        const event = await eventService.findById(id);

        res.json({ event });
    }

    async findUpcoming(req: Request, res: Response) {
        const limit = parseInt(req.query.limit as string) || 5;

        const events = await eventService.findUpcoming(limit);

        res.json({ events });
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = updateEventSchema.parse(req.body);

        const event = await eventService.update(id, data);

        res.json({
            message: 'Evento atualizado com sucesso',
            event,
        });
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        await eventService.delete(id);

        res.json({ message: 'Evento removido com sucesso' });
    }

    // ========================================
    // ESCALAS
    // ========================================

    async addSchedule(req: Request, res: Response) {
        const { id: eventId } = req.params;
        const data = addScheduleSchema.parse(req.body);

        const schedule = await eventService.addSchedule(eventId, data);

        res.status(201).json({
            message: 'Membro adicionado à escala',
            schedule,
        });
    }

    async updateSchedule(req: Request, res: Response) {
        const { scheduleId } = req.params;
        const { confirmed } = updateScheduleSchema.parse(req.body);

        const schedule = await eventService.updateScheduleConfirmation(scheduleId, confirmed);

        res.json({
            message: confirmed ? 'Presença confirmada' : 'Presença desmarcada',
            schedule,
        });
    }

    async removeSchedule(req: Request, res: Response) {
        const { scheduleId } = req.params;

        await eventService.removeSchedule(scheduleId);

        res.json({ message: 'Membro removido da escala' });
    }

    async getMemberSchedules(req: Request, res: Response) {
        const { memberId } = req.params;

        const schedules = await eventService.getSchedulesByMember(memberId);

        res.json({ schedules });
    }
}

export const eventController = new EventController();
