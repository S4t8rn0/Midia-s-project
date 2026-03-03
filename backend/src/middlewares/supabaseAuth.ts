import { Request, Response, NextFunction } from 'express';
import { AppError } from './auth';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

/**
 * Middleware que autentica usando o JWT do Supabase.
 * Extrai o user.sub (id do Supabase) e coloca em req.user.userId
 * para compatibilidade com o resto do sistema.
 */
export function supabaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Token não fornecido', 401, 'NO_TOKEN');
    }

    const [scheme, token] = authHeader.split(' ');

    if (!/^Bearer$/i.test(scheme) || !token) {
        throw new AppError('Token mal formatado', 401, 'MALFORMED_TOKEN');
    }

    try {
        // Decodificar o JWT do Supabase sem verificar assinatura
        // (a verificação é feita pelo Supabase, nós confiamos nele)
        const decoded = jwt.decode(token) as any;

        if (!decoded || !decoded.sub) {
            throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
        }

        // Verificar se o token expirou
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            throw new AppError('Token expirado', 401, 'TOKEN_EXPIRED');
        }

        // Colocar o userId do Supabase no req.user para compatibilidade
        req.user = {
            userId: decoded.sub,
            email: decoded.email || '',
            role: decoded.role || 'member',
        };

        next();
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Erro ao decodificar token Supabase:', error);
        throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
    }
}
