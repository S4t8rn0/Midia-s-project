import { Router } from 'express';
import { memberController } from '../controllers/memberController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

// Todas as rotas de membros requerem autenticação
router.use(authMiddleware);

// Listar funções disponíveis
router.get('/roles', memberController.getRoles.bind(memberController));

// Listar membros (com paginação e filtros)
router.get('/', memberController.findAll.bind(memberController));

// Buscar membro por ID
router.get('/:id', memberController.findById.bind(memberController));

// Buscar membros por função
router.get('/role/:role', memberController.findByRole.bind(memberController));

// Criar membro (apenas admin)
router.post('/', roleMiddleware('admin'), memberController.create.bind(memberController));

// Atualizar membro (apenas admin)
router.put('/:id', roleMiddleware('admin'), memberController.update.bind(memberController));

// Deletar membro (apenas admin)
router.delete('/:id', roleMiddleware('admin'), memberController.delete.bind(memberController));

export default router;
