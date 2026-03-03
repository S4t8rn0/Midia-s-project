import { query, queryOne } from '../config/database';
import { KanbanTask, PaginatedResponse } from '../types';
import { AppError } from '../middlewares/auth';

interface KanbanTaskRow {
    id: string;
    title: string;
    description: string | null;
    status: 'ideas' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee_id: string | null;
    position: number;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
    // Campos do JOIN com member
    assignee_name?: string;
    assignee_avatar?: string;
}

function mapTaskRowToTask(row: KanbanTaskRow): KanbanTask & { assignee?: { id: string; name: string; avatar?: string } } {
    return {
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        status: row.status,
        priority: row.priority,
        assigneeId: row.assignee_id || undefined,
        position: row.position,
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assignee: row.assignee_name ? {
            id: row.assignee_id!,
            name: row.assignee_name,
            avatar: row.assignee_avatar || undefined,
        } : undefined,
    };
}

export type TaskStatus = 'ideas' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskDTO {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
}

export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string | null;
}

export interface MoveTaskDTO {
    status: TaskStatus;
    position: number;
}

export interface TaskFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    search?: string;
}

export interface KanbanBoard {
    ideas: (KanbanTask & { assignee?: { id: string; name: string; avatar?: string } })[];
    in_progress: (KanbanTask & { assignee?: { id: string; name: string; avatar?: string } })[];
    review: (KanbanTask & { assignee?: { id: string; name: string; avatar?: string } })[];
    done: (KanbanTask & { assignee?: { id: string; name: string; avatar?: string } })[];
}

export class KanbanService {
    async create(data: CreateTaskDTO, userId: string): Promise<KanbanTask> {
        const status = data.status || 'ideas';

        // Obter a maior posição na coluna para adicionar no final
        const [maxPos] = await query<{ max: number | null }>(
            'SELECT MAX(position) as max FROM kanban_tasks WHERE status = $1',
            [status]
        );
        const position = (maxPos?.max ?? -1) + 1;

        const [task] = await query<KanbanTaskRow>(
            `INSERT INTO kanban_tasks (title, description, status, priority, assignee_id, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                data.title,
                data.description || null,
                status,
                data.priority || 'medium',
                data.assigneeId || null,
                position,
                userId,
            ]
        );

        return mapTaskRowToTask(task);
    }

    async getBoard(): Promise<KanbanBoard> {
        const tasks = await query<KanbanTaskRow>(
            `SELECT 
        kt.*,
        m.name as assignee_name,
        m.avatar as assignee_avatar
       FROM kanban_tasks kt
       LEFT JOIN members m ON kt.assignee_id = m.id
       ORDER BY kt.position ASC`
        );

        const board: KanbanBoard = {
            ideas: [],
            in_progress: [],
            review: [],
            done: [],
        };

        tasks.forEach((task) => {
            const mapped = mapTaskRowToTask(task);
            board[task.status].push(mapped);
        });

        return board;
    }

    async findAll(filters: TaskFilters = {}): Promise<(KanbanTask & { assignee?: { id: string; name: string; avatar?: string } })[]> {
        const { status, priority, assigneeId, search } = filters;

        let whereClause = 'WHERE 1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` AND kt.status = $${paramIndex++}`;
            params.push(status);
        }

        if (priority) {
            whereClause += ` AND kt.priority = $${paramIndex++}`;
            params.push(priority);
        }

        if (assigneeId) {
            whereClause += ` AND kt.assignee_id = $${paramIndex++}`;
            params.push(assigneeId);
        }

        if (search) {
            whereClause += ` AND (kt.title ILIKE $${paramIndex} OR kt.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const tasks = await query<KanbanTaskRow>(
            `SELECT 
        kt.*,
        m.name as assignee_name,
        m.avatar as assignee_avatar
       FROM kanban_tasks kt
       LEFT JOIN members m ON kt.assignee_id = m.id
       ${whereClause}
       ORDER BY kt.status, kt.position ASC`,
            params
        );

        return tasks.map(mapTaskRowToTask);
    }

    async findById(id: string): Promise<KanbanTask & { assignee?: { id: string; name: string; avatar?: string } }> {
        const task = await queryOne<KanbanTaskRow>(
            `SELECT 
        kt.*,
        m.name as assignee_name,
        m.avatar as assignee_avatar
       FROM kanban_tasks kt
       LEFT JOIN members m ON kt.assignee_id = m.id
       WHERE kt.id = $1`,
            [id]
        );

        if (!task) {
            throw new AppError('Tarefa não encontrada', 404, 'TASK_NOT_FOUND');
        }

        return mapTaskRowToTask(task);
    }

    async update(id: string, data: UpdateTaskDTO): Promise<KanbanTask> {
        // Verificar se a tarefa existe
        await this.findById(id);

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
        if (data.priority !== undefined) {
            updates.push(`priority = $${paramIndex++}`);
            params.push(data.priority);
        }
        if (data.assigneeId !== undefined) {
            updates.push(`assignee_id = $${paramIndex++}`);
            params.push(data.assigneeId || null);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        params.push(id);
        const [task] = await query<KanbanTaskRow>(
            `UPDATE kanban_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        return mapTaskRowToTask(task);
    }

    async move(id: string, data: MoveTaskDTO): Promise<KanbanTask> {
        const task = await this.findById(id);
        const oldStatus = task.status;
        const oldPosition = task.position;
        const newStatus = data.status;
        const newPosition = data.position;

        // Se está movendo para a mesma coluna
        if (oldStatus === newStatus) {
            if (oldPosition === newPosition) {
                return task; // Nada mudou
            }

            // Reordenar dentro da mesma coluna
            if (newPosition > oldPosition) {
                // Movendo para baixo: decrementar posição dos itens entre oldPos+1 e newPos
                await query(
                    `UPDATE kanban_tasks 
           SET position = position - 1 
           WHERE status = $1 AND position > $2 AND position <= $3`,
                    [oldStatus, oldPosition, newPosition]
                );
            } else {
                // Movendo para cima: incrementar posição dos itens entre newPos e oldPos-1
                await query(
                    `UPDATE kanban_tasks 
           SET position = position + 1 
           WHERE status = $1 AND position >= $2 AND position < $3`,
                    [oldStatus, newPosition, oldPosition]
                );
            }
        } else {
            // Movendo para outra coluna
            // 1. Decrementar posição dos itens abaixo na coluna antiga
            await query(
                `UPDATE kanban_tasks 
         SET position = position - 1 
         WHERE status = $1 AND position > $2`,
                [oldStatus, oldPosition]
            );

            // 2. Incrementar posição dos itens a partir da nova posição na nova coluna
            await query(
                `UPDATE kanban_tasks 
         SET position = position + 1 
         WHERE status = $1 AND position >= $2`,
                [newStatus, newPosition]
            );
        }

        // Atualizar a tarefa com nova posição e status
        const [updatedTask] = await query<KanbanTaskRow>(
            `UPDATE kanban_tasks SET status = $1, position = $2 WHERE id = $3 RETURNING *`,
            [newStatus, newPosition, id]
        );

        return mapTaskRowToTask(updatedTask);
    }

    async delete(id: string): Promise<void> {
        const task = await this.findById(id);

        // Decrementar posição dos itens abaixo
        await query(
            `UPDATE kanban_tasks 
       SET position = position - 1 
       WHERE status = $1 AND position > $2`,
            [task.status, task.position]
        );

        await query('DELETE FROM kanban_tasks WHERE id = $1', [id]);
    }

    async getTasksByAssignee(assigneeId: string): Promise<KanbanTask[]> {
        const tasks = await query<KanbanTaskRow>(
            `SELECT * FROM kanban_tasks WHERE assignee_id = $1 ORDER BY status, position ASC`,
            [assigneeId]
        );

        return tasks.map(mapTaskRowToTask);
    }

    async getStats(): Promise<{ total: number; byStatus: Record<TaskStatus, number>; byPriority: Record<TaskPriority, number> }> {
        const [totalResult] = await query<{ count: string }>('SELECT COUNT(*) as count FROM kanban_tasks');

        const statusCounts = await query<{ status: TaskStatus; count: string }>(
            'SELECT status, COUNT(*) as count FROM kanban_tasks GROUP BY status'
        );

        const priorityCounts = await query<{ priority: TaskPriority; count: string }>(
            'SELECT priority, COUNT(*) as count FROM kanban_tasks GROUP BY priority'
        );

        const byStatus: Record<TaskStatus, number> = { ideas: 0, in_progress: 0, review: 0, done: 0 };
        statusCounts.forEach((s) => { byStatus[s.status] = parseInt(s.count); });

        const byPriority: Record<TaskPriority, number> = { low: 0, medium: 0, high: 0 };
        priorityCounts.forEach((p) => { byPriority[p.priority] = parseInt(p.count); });

        return {
            total: parseInt(totalResult.count),
            byStatus,
            byPriority,
        };
    }
}

export const kanbanService = new KanbanService();
