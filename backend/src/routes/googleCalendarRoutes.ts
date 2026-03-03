import { Router } from 'express';
import { googleCalendarController } from '../controllers/googleCalendarController';
import { supabaseAuthMiddleware } from '../middlewares/supabaseAuth';

const router = Router();

// Rota pública - callback do OAuth (o Google redireciona para cá)
// NÃO precisa de auth porque o usuário vem do redirect do Google
router.get('/callback', googleCalendarController.callback.bind(googleCalendarController));

// Rotas protegidas com Supabase Auth
router.use(supabaseAuthMiddleware);

// Obter URL de autenticação
router.get('/auth-url', googleCalendarController.getAuthUrl.bind(googleCalendarController));

// Status da conexão
router.get('/status', googleCalendarController.status.bind(googleCalendarController));

// Desconectar
router.post('/disconnect', googleCalendarController.disconnect.bind(googleCalendarController));

// Listar eventos do Google Calendar
router.get('/events', googleCalendarController.listEvents.bind(googleCalendarController));

// Listar eventos de um mês específico do Google Calendar
router.get('/month-events', googleCalendarController.monthEvents.bind(googleCalendarController));

// CRUD direto no Google Calendar
router.post('/events', googleCalendarController.createGoogleEvent.bind(googleCalendarController));
router.put('/events/:id', googleCalendarController.updateGoogleEvent.bind(googleCalendarController));
router.delete('/events/:id', googleCalendarController.deleteGoogleEvent.bind(googleCalendarController));

// Sincronizar evento local com Google Calendar
router.post('/sync/:eventId', googleCalendarController.syncEvent.bind(googleCalendarController));

// Remover evento do Google Calendar
router.delete('/sync/:eventId', googleCalendarController.unsyncEvent.bind(googleCalendarController));

export default router;
