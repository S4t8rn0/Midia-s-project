import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Server
    PORT: z.string().default('4000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),

    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

    // JWT
    JWT_SECRET: z.string().min(1, 'JWT_SECRET é obrigatória'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET é obrigatória'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Google Calendar (opcional inicialmente)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().optional(),
    GOOGLE_CALENDAR_ID: z.string().default('primary'),

    // Cloudinary (opcional inicialmente)
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    // Evolution API (opcional inicialmente)
    EVOLUTION_API_URL: z.string().optional(),
    EVOLUTION_API_KEY: z.string().optional(),
    EVOLUTION_INSTANCE_NAME: z.string().optional(),

    // Session
    SESSION_SECRET: z.string().default('dev-session-secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
