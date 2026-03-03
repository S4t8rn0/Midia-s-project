import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';

// Detecta automaticamente se é Supabase para ativar SSL
const isSupabase = env.DATABASE_URL.includes('supabase');

// Parseia a DATABASE_URL manualmente para evitar problemas com caracteres
// especiais na senha (ex: # é interpretado como fragmento pelo URL parser)
function parseDatabaseUrl(url: string) {
    // postgresql://user:password@host:port/database
    const match = url.match(/^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/);
    if (!match) {
        throw new Error(`DATABASE_URL inválida: ${url}`);
    }
    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5],
    };
}

const dbConfig = parseDatabaseUrl(env.DATABASE_URL);

export const pool = new Pool({
    ...dbConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ...(isSupabase && {
        ssl: { rejectUnauthorized: false },
    }),
});

pool.on('error', (err) => {
    logger.error('Erro inesperado no pool do PostgreSQL', err);
    process.exit(-1);
});

export async function testConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        logger.info(`✅ PostgreSQL conectado: ${result.rows[0].now}`);
        return true;
    } catch (error) {
        logger.error('❌ Falha ao conectar no PostgreSQL:', error);
        return false;
    }
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (env.NODE_ENV === 'development') {
        logger.debug(`Query executada em ${duration}ms: ${text.substring(0, 100)}...`);
    }

    return result.rows as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
    const rows = await query<T>(text, params);
    return rows[0] || null;
}
