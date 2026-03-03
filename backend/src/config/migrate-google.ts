import { pool } from './database';
import { logger } from '../utils/logger';

const addGoogleCalendarConfigSQL = `
-- ========================================
-- TABELA: google_calendar_config (Configuração global do Google Calendar)
-- Apenas UMA linha — armazena os tokens da conta conectada
-- ========================================
CREATE TABLE IF NOT EXISTS google_calendar_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date VARCHAR(50),
  connected_by UUID,
  connected_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_google_calendar_config_updated_at ON google_calendar_config;
CREATE TRIGGER update_google_calendar_config_updated_at
  BEFORE UPDATE ON google_calendar_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function migrateGoogleCalendarConfig() {
    logger.info('🔄 Criando tabela google_calendar_config...');

    try {
        await pool.query(addGoogleCalendarConfigSQL);
        logger.info('✅ Tabela google_calendar_config criada com sucesso!');
    } catch (error) {
        logger.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

migrateGoogleCalendarConfig()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
