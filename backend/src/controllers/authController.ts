import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';

const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    role: z.enum(['admin', 'member']).optional(),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export class AuthController {
    async register(req: Request, res: Response) {
        const { name, email, password, role, phone } = registerSchema.parse(req.body);

        const result = await authService.register(name, email, password, role, phone);

        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            ...result,
        });
    }

    async login(req: Request, res: Response) {
        const { email, password } = loginSchema.parse(req.body);

        const result = await authService.login(email, password);

        res.json({
            message: 'Login realizado com sucesso',
            ...result,
        });
    }

    async refresh(req: Request, res: Response) {
        const { refreshToken } = refreshSchema.parse(req.body);

        const tokens = await authService.refreshToken(refreshToken);

        res.json({
            message: 'Token renovado com sucesso',
            ...tokens,
        });
    }

    async logout(req: Request, res: Response) {
        const { refreshToken } = refreshSchema.parse(req.body);

        await authService.logout(refreshToken);

        res.json({ message: 'Logout realizado com sucesso' });
    }

    async me(req: Request, res: Response) {
        const user = await authService.getMe(req.user!.userId);

        res.json({ user });
    }
}

export const authController = new AuthController();
