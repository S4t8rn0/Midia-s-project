import { Router } from 'express';
import authRoutes from './authRoutes';
import memberRoutes from './memberRoutes';
import eventRoutes from './eventRoutes';
import kanbanRoutes from './kanbanRoutes';
import googleCalendarRoutes from './googleCalendarRoutes';
import eventPublicRoutes from './eventPublicRoutes';
import memberPublicRoutes from './memberPublicRoutes';
// import fileRoutes from './fileRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Rotas da API
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/events', eventRoutes);
router.use('/kanban', kanbanRoutes);
router.use('/google-calendar', googleCalendarRoutes);
router.use('/events-public', eventPublicRoutes); // Rotas sem auth para dev
router.use('/members-public', memberPublicRoutes); // Rotas de membros sem auth
// router.use('/files', fileRoutes);

export default router;
