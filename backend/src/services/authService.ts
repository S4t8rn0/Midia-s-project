import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { env } from '../config/env';
import { User, TokenPayload, AuthResponse } from '../types';
import { AppError } from '../middlewares/auth';
import crypto from 'crypto';

interface UserRow {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: 'admin' | 'member';
    phone: string | null;
    avatar: string | null;
    created_at: Date;
    updated_at: Date;
}

function mapUserRowToUser(row: UserRow): User {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        phone: row.phone || undefined,
        avatar: row.avatar || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class AuthService {
    private readonly SALT_ROUNDS = 12;

    async register(
        name: string,
        email: string,
        password: string,
        role: 'admin' | 'member' = 'member',
        phone?: string
    ): Promise<AuthResponse> {
        // Verificar se o email já existe
        const existing = await queryOne<UserRow>(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing) {
            throw new AppError('Email já cadastrado', 400, 'EMAIL_EXISTS');
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Criar usuário
        const [user] = await query<UserRow>(
            `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, email, passwordHash, role, phone || null]
        );

        // Gerar tokens
        const tokens = await this.generateTokens(mapUserRowToUser(user));

        const userMapped = mapUserRowToUser(user);
        const { passwordHash: _, ...userWithoutPassword } = userMapped;

        return {
            user: userWithoutPassword as Omit<User, 'passwordHash'>,
            ...tokens,
        };
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        // Buscar usuário
        const user = await queryOne<UserRow>(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
        }

        // Verificar senha
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
        }

        // Gerar tokens
        const tokens = await this.generateTokens(mapUserRowToUser(user));

        const userMapped = mapUserRowToUser(user);
        const { passwordHash: _, ...userWithoutPassword } = userMapped;

        return {
            user: userWithoutPassword as Omit<User, 'passwordHash'>,
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Verificar se o refresh token existe e é válido
        const tokenRow = await queryOne<{ user_id: string; expires_at: Date }>(
            'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1',
            [refreshToken]
        );

        if (!tokenRow) {
            throw new AppError('Refresh token inválido', 401, 'INVALID_REFRESH_TOKEN');
        }

        if (new Date(tokenRow.expires_at) < new Date()) {
            // Remover token expirado
            await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            throw new AppError('Refresh token expirado', 401, 'REFRESH_TOKEN_EXPIRED');
        }

        // Buscar usuário
        const user = await queryOne<UserRow>(
            'SELECT * FROM users WHERE id = $1',
            [tokenRow.user_id]
        );

        if (!user) {
            throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
        }

        // Remover refresh token antigo
        await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

        // Gerar novos tokens
        return this.generateTokens(mapUserRowToUser(user));
    }

    async logout(refreshToken: string): Promise<void> {
        await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    async getMe(userId: string): Promise<Omit<User, 'passwordHash'>> {
        const user = await queryOne<UserRow>(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );

        if (!user) {
            throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
        }

        const userMapped = mapUserRowToUser(user);
        const { passwordHash: _, ...userWithoutPassword } = userMapped;
        return userWithoutPassword as Omit<User, 'passwordHash'>;
    }

    private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
        const payload: TokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        } as jwt.SignOptions);

        const refreshToken = crypto.randomBytes(40).toString('hex');

        // Calcular expiração do refresh token
        const expiresAt = new Date();
        const days = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 30;
        expiresAt.setDate(expiresAt.getDate() + days);

        // Salvar refresh token no banco
        await query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiresAt]
        );

        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();
