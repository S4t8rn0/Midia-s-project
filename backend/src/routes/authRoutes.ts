import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));

// Rotas protegidas
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.get('/me', authMiddleware, authController.me.bind(authController));

export default router;
