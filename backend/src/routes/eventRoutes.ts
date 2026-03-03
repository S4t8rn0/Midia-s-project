import { Router } from 'express';
import { eventController } from '../controllers/eventController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de eventos requerem autenticação
router.use(authMiddleware);

// Listar próximos eventos
router.get('/upcoming', eventController.findUpcoming.bind(eventController));

// Listar todos os eventos (com paginação e filtros)
router.get('/', eventController.findAll.bind(eventController));

// Buscar evento por ID (inclui escalas)
router.get('/:id', eventController.findById.bind(eventController));

// Criar evento (apenas admin)
router.post('/', roleMiddleware('admin'), eventController.create.bind(eventController));

// Atualizar evento (apenas admin)
router.put('/:id', roleMiddleware('admin'), eventController.update.bind(eventController));

// Deletar evento (apenas admin)
router.delete('/:id', roleMiddleware('admin'), eventController.delete.bind(eventController));

// ========================================
// ESCALAS
// ========================================

// Adicionar membro à escala (apenas admin)
router.post('/:id/schedules', roleMiddleware('admin'), eventController.addSchedule.bind(eventController));

// Atualizar confirmação de presença (qualquer usuário autenticado pode confirmar)
router.patch('/schedules/:scheduleId', eventController.updateSchedule.bind(eventController));

// Remover membro da escala (apenas admin)
router.delete('/schedules/:scheduleId', roleMiddleware('admin'), eventController.removeSchedule.bind(eventController));

// Buscar escalas de um membro
router.get('/member/:memberId/schedules', eventController.getMemberSchedules.bind(eventController));

export default router;
