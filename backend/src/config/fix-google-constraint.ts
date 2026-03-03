import { pool } from './database';
import { logger } from '../utils/logger';

const fixGoogleConfigSQL = `
-- Remover foreign key constraint que aponta para tabela users
-- (os IDs vêm do Supabase Auth, não da tabela users do backend)
ALTER TABLE google_calendar_config 
DROP CONSTRAINT IF EXISTS google_calendar_config_connected_by_fkey;
`;

async function fix() {
    logger.info('🔧 Removendo constraint de google_calendar_config...');
    try {
        await pool.query(fixGoogleConfigSQL);
        logger.info('✅ Constraint removida com sucesso!');
    } catch (error) {
        logger.error('❌ Erro:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

fix().then(() => process.exit(0)).catch(() => process.exit(1));
