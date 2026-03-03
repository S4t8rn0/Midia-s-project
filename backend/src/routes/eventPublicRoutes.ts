import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eventService } from '../services/eventService';

const router = Router();

// ========================================
// ROTAS PÚBLICAS DE EVENTOS (DEV)
// Sem autenticação para facilitar integração frontend
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

/**
 * Codifica metadata (type e assigneeIds) na description do evento
 */
function encodeMetadata(type: string, assigneeIds: string[], description?: string): string {
    const meta = `[TYPE:${type}][ASSIGNEES:${JSON.stringify(assigneeIds)}]`;
    return `${meta}${description || ''}`;
}

/**
 * Decodifica metadata da description do evento
 */
function decodeMetadata(description: string | null | undefined) {
    const raw = description || '';
    const typeMatch = raw.match(/\[TYPE:(\w+)\]/);
    const assigneesMatch = raw.match(/\[ASSIGNEES:(\[.*?\])\]/);

    const type = typeMatch?.[1] || 'SERVICE';
    let assigneeIds: string[] = [];
    try {
        assigneeIds = assigneesMatch ? JSON.parse(assigneesMatch[1]) : [];
    } catch { }

    const cleanDesc = raw
        .replace(/\[TYPE:\w+\]/, '')
        .replace(/\[ASSIGNEES:\[.*?\]\]/, '')
        .trim();

    return { type, assigneeIds, description: cleanDesc };
}

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
    const events = result.data.map(ev => {
        const meta = decodeMetadata(ev.description);
        // Usar assigneeIds da metadata, ou fallback para schedules
        const assigneeIds = meta.assigneeIds.length > 0
            ? meta.assigneeIds
            : (ev.schedules?.map(s => s.memberId) || []);

        return {
            id: ev.id,
            title: ev.title,
            date: new Date(ev.startDate).toISOString().split('T')[0], // YYYY-MM-DD
            type: meta.type,
            assigneeIds,
            description: meta.description,
        };
    });

    res.json({ events });
});

// Criar evento
router.post('/', async (req: Request, res: Response) => {
    const data = createEventSchema.parse(req.body);

    // Converter do formato frontend para o formato backend
    const startDate = new Date(`${data.date}T09:00:00`);
    const endDate = new Date(`${data.date}T10:00:00`);

    // Guardar type e assigneeIds na description como metadata
    const descriptionWithMeta = encodeMetadata(data.type, data.assigneeIds, data.description);

    const event = await eventService.create({
        title: data.title,
        description: descriptionWithMeta,
        startDate,
        endDate,
    }, '');

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

    // Buscar evento atual para preservar metadata existente
    const currentEvent = await eventService.findById(id);
    const currentMeta = decodeMetadata(currentEvent.description);

    const type = data.type || currentMeta.type;
    const assigneeIds = data.assigneeIds !== undefined ? data.assigneeIds : currentMeta.assigneeIds;
    const desc = data.description !== undefined ? data.description : currentMeta.description;

    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.date) {
        updateData.startDate = new Date(`${data.date}T09:00:00`);
        updateData.endDate = new Date(`${data.date}T10:00:00`);
    }

    // Sempre atualizar a description com a metadata completa
    updateData.description = encodeMetadata(type, assigneeIds, desc);

    const event = await eventService.update(id, updateData);

    res.json({
        event: {
            id: event.id,
            title: event.title,
            date: data.date || new Date(event.startDate).toISOString().split('T')[0],
            type,
            assigneeIds,
            description: desc,
        },
    });
});

// Deletar evento
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await eventService.delete(id);
    res.json({ message: 'Evento removido com sucesso' });
});

export default router;
