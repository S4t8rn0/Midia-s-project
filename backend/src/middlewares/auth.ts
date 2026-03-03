import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types';
import { logger } from '../utils/logger';

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 400,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Token não fornecido', 401, 'NO_TOKEN');
    }

    const [scheme, token] = authHeader.split(' ');

    if (!/^Bearer$/i.test(scheme)) {
        throw new AppError('Token mal formatado', 401, 'MALFORMED_TOKEN');
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Token expirado', 401, 'TOKEN_EXPIRED');
        }
        throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
    }
}

export function roleMiddleware(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError('Usuário não autenticado', 401, 'NOT_AUTHENTICATED');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError('Acesso negado. Permissão insuficiente.', 403, 'FORBIDDEN');
        }

        next();
    };
}

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.code || 'APP_ERROR',
            message: error.message,
        });
    }

    logger.error('Erro não tratado:', error);

    return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'development'
            ? error.message
            : 'Erro interno do servidor',
    });
}
