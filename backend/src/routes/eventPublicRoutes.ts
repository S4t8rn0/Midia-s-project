import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eventService } from '../services/eventService';

const router = Router();

// ========================================
// ROTAS PÚBLICAS DE EVENTOS (DEV)
// Sem autenticação para facilitar integração frontend
// TODO: Migrar para as rotas autenticadas quando auth estiver no frontend
// ========================================

const createEventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    date: z.string(), // YYYY-MM-DD (formato do frontend)
    type: z.enum(['SERVICE', 'EVENT', 'HOLIDAY']),
    assigneeIds: z.array(z.string()).default([]),
});

const updateEventSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    type: z.enum(['SERVICE', 'EVENT', 'HOLIDAY']).optional(),
    assigneeIds: z.array(z.string()).optional(),
});

// Listar todos os eventos
router.get('/', async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const result = await eventService.findAll({
        page: 1,
        limit: 500,
        ...(month && year ? {
            startDate: `${year}-${String(month).padStart(2, '0')}-01`,
            endDate: `${year}-${String(month).padStart(2, '0')}-31`,
        } : {}),
    });

    // Mapear para o formato do frontend (CalendarEvent)
    const events = result.data.map(ev => ({
        id: ev.id,
        title: ev.title,
        date: new Date(ev.startDate).toISOString().split('T')[0], // YYYY-MM-DD
        type: (ev.description?.match(/\[TYPE:(\w+)\]/)?.[1] || 'SERVICE') as string,
        assigneeIds: ev.schedules?.map(s => s.memberId) || [],
        description: ev.description?.replace(/\[TYPE:\w+\]/, '').trim() || '',
    }));

    res.json({ events });
});

// Criar evento
router.post('/', async (req: Request, res: Response) => {
    const data = createEventSchema.parse(req.body);

    // Converter do formato frontend para o formato backend
    const startDate = new Date(`${data.date}T09:00:00`);
    const endDate = new Date(`${data.date}T10:00:00`);

    // Guardar o type e assigneeIds na description como metadata
    const descriptionWithMeta = `[TYPE:${data.type}]${data.description || ''}`;

    const event = await eventService.create({
        title: data.title,
        description: descriptionWithMeta,
        startDate,
        endDate,
    }, ''); // Sem usuário autenticado (dev mode)

    // Google Calendar sync requer autenticação OAuth — desativado em rotas públicas
    // TODO: Ativar quando o frontend tiver sistema de auth

    // Retornar no formato do frontend
    res.status(201).json({
        event: {
            id: event.id,
            title: event.title,
            date: data.date,
            type: data.type,
            assigneeIds: data.assigneeIds,
            description: data.description || '',
        },
    });
});

// Atualizar evento
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = updateEventSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.date) {
        updateData.startDate = new Date(`${data.date}T09:00:00`);
        updateData.endDate = new Date(`${data.date}T10:00:00`);
    }
    if (data.description !== undefined || data.type) {
        const type = data.type || 'SERVICE';
        updateData.description = `[TYPE:${type}]${data.description || ''}`;
    }

    const event = await eventService.update(id, updateData);

    // Google Calendar sync desativado em rotas públicas

    res.json({
        event: {
            id: event.id,
            title: event.title,
            date: data.date || new Date(event.startDate).toISOString().split('T')[0],
            type: data.type || 'SERVICE',
            assigneeIds: data.assigneeIds || [],
            description: data.description || '',
        },
    });
});

// Deletar evento
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    // Google Calendar unsync desativado em rotas públicas


    await eventService.delete(id);

    res.json({ message: 'Evento removido com sucesso' });
});

export default router;
