import { Router } from 'express';
import { kanbanController } from '../controllers/kanbanController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de kanban requerem autenticação
router.use(authMiddleware);

// Obter o quadro completo (todas as colunas)
router.get('/board', kanbanController.getBoard.bind(kanbanController));

// Estatísticas do kanban
router.get('/stats', kanbanController.getStats.bind(kanbanController));

// Listar todas as tarefas (com filtros)
router.get('/', kanbanController.findAll.bind(kanbanController));

// Buscar tarefa por ID
router.get('/:id', kanbanController.findById.bind(kanbanController));

// Tarefas de um membro específico
router.get('/assignee/:assigneeId', kanbanController.getTasksByAssignee.bind(kanbanController));

// Criar tarefa
router.post('/', kanbanController.create.bind(kanbanController));

// Atualizar tarefa (título, descrição, prioridade, responsável)
router.put('/:id', kanbanController.update.bind(kanbanController));

// Mover tarefa (drag & drop - muda status e/ou posição)
router.patch('/:id/move', kanbanController.move.bind(kanbanController));

// Deletar tarefa
router.delete('/:id', kanbanController.delete.bind(kanbanController));

export default router;
