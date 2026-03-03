import { Request, Response } from 'express';
import { z } from 'zod';
import { kanbanService } from '../services/kanbanService';

const statusEnum = z.enum(['ideas', 'in_progress', 'review', 'done']);
const priorityEnum = z.enum(['low', 'medium', 'high']);

const createTaskSchema = z.object({
    title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assigneeId: z.string().uuid('ID do responsável inválido').optional(),
});

const updateTaskSchema = z.object({
    title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres').optional(),
    description: z.string().optional(),
    priority: priorityEnum.optional(),
    assigneeId: z.string().uuid('ID do responsável inválido').optional().nullable(),
});

const moveTaskSchema = z.object({
    status: statusEnum,
    position: z.number().int().min(0),
});

const listTasksSchema = z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assigneeId: z.string().uuid().optional(),
    search: z.string().optional(),
});

export class KanbanController {
    async create(req: Request, res: Response) {
        const data = createTaskSchema.parse(req.body);
        const userId = req.user!.userId;

        const task = await kanbanService.create(data, userId);

        res.status(201).json({
            message: 'Tarefa criada com sucesso',
            task,
        });
    }

    async getBoard(req: Request, res: Response) {
        const board = await kanbanService.getBoard();

        res.json({ board });
    }

    async findAll(req: Request, res: Response) {
        const filters = listTasksSchema.parse(req.query);

        const tasks = await kanbanService.findAll(filters);

        res.json({ tasks });
    }

    async findById(req: Request, res: Response) {
        const { id } = req.params;

        const task = await kanbanService.findById(id);

        res.json({ task });
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = updateTaskSchema.parse(req.body);

        // Converter null para undefined para assigneeId
        const cleanData = {
            ...data,
            assigneeId: data.assigneeId === null ? undefined : data.assigneeId,
        };

        const task = await kanbanService.update(id, cleanData);

        res.json({
            message: 'Tarefa atualizada com sucesso',
            task,
        });
    }

    async move(req: Request, res: Response) {
        const { id } = req.params;
        const data = moveTaskSchema.parse(req.body);

        const task = await kanbanService.move(id, data);

        res.json({
            message: 'Tarefa movida com sucesso',
            task,
        });
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        await kanbanService.delete(id);

        res.json({ message: 'Tarefa removida com sucesso' });
    }

    async getStats(req: Request, res: Response) {
        const stats = await kanbanService.getStats();

        res.json({ stats });
    }

    async getTasksByAssignee(req: Request, res: Response) {
        const { assigneeId } = req.params;

        const tasks = await kanbanService.getTasksByAssignee(assigneeId);

        res.json({ tasks });
    }
}

export const kanbanController = new KanbanController();
