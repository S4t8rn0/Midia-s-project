import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { testConnection } from './config/database';
import { errorHandler } from './middlewares/auth';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();

// ========================================
// MIDDLEWARES GLOBAIS
// ========================================

// CORS configurado para permitir origens locais em dev
const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin === env.FRONTEND_ORIGIN) return callback(null, true);
        if (origin.startsWith('http://localhost')) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Log de requisições (apenas em dev)
if (env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
    });
}

// ========================================
// ROTAS
// ========================================

app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        name: 'Mídia Igreja API',
        version: '1.0.0',
        status: 'running',
        docs: '/api/health',
    });
});

// ========================================
// TRATAMENTO DE ERROS
// ========================================

// 404 - Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Rota ${req.method} ${req.path} não encontrada`,
    });
});

// Error handler global
app.use(errorHandler);

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

async function bootstrap() {
    logger.info('🚀 Iniciando servidor...');

    // Testar conexão com o banco
    const dbConnected = await testConnection();
    if (!dbConnected) {
        logger.error('❌ Não foi possível conectar ao banco de dados. Encerrando...');
        process.exit(1);
    }

    // Iniciar servidor
    app.listen(parseInt(env.PORT), () => {
        logger.info(`✅ Servidor rodando na porta ${env.PORT}`);
        logger.info(`📍 Ambiente: ${env.NODE_ENV}`);
        logger.info(`🌐 Frontend: ${env.FRONTEND_ORIGIN}`);
        logger.info(`🔗 API: http://localhost:${env.PORT}/api`);
    });
}

bootstrap().catch((error) => {
    logger.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});

export default app;
