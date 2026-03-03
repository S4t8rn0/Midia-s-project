import { query, queryOne } from '../config/database';
import { Member, PaginatedResponse } from '../types';
import { AppError } from '../middlewares/auth';

interface MemberRow {
    id: string;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    avatar: string | null;
    user_id: string | null;
    created_at: Date;
    updated_at: Date;
}

function mapMemberRowToMember(row: MemberRow): Member {
    return {
        id: row.id,
        name: row.name,
        role: row.role,
        phone: row.phone || undefined,
        email: row.email || undefined,
        notes: row.notes || undefined,
        avatar: row.avatar || undefined,
        userId: row.user_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface CreateMemberDTO {
    name: string;
    role: string;
    phone?: string;
    email?: string;
    notes?: string;
    avatar?: string;
    userId?: string;
}

export interface UpdateMemberDTO {
    name?: string;
    role?: string;
    phone?: string;
    email?: string;
    notes?: string;
    avatar?: string;
    userId?: string;
}

export interface MemberFilters {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}

export class MemberService {
    async create(data: CreateMemberDTO): Promise<Member> {
        // Verificar se já existe membro com o mesmo email
        if (data.email) {
            const existing = await queryOne<MemberRow>(
                'SELECT id FROM members WHERE email = $1',
                [data.email]
            );
            if (existing) {
                throw new AppError('Já existe um membro com este email', 400, 'EMAIL_EXISTS');
            }
        }

        const [member] = await query<MemberRow>(
            `INSERT INTO members (name, role, phone, email, notes, avatar, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                data.name,
                data.role,
                data.phone || null,
                data.email || null,
                data.notes || null,
                data.avatar || null,
                data.userId || null,
            ]
        );

        return mapMemberRowToMember(member);
    }

    async findAll(filters: MemberFilters = {}): Promise<PaginatedResponse<Member>> {
        const { search, role, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            whereClause += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        // Contar total
        const [countResult] = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM members ${whereClause}`,
            params
        );
        const total = parseInt(countResult.count);

        // Buscar membros
        const members = await query<MemberRow>(
            `SELECT * FROM members ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        return {
            data: members.map(mapMemberRowToMember),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string): Promise<Member> {
        const member = await queryOne<MemberRow>(
            'SELECT * FROM members WHERE id = $1',
            [id]
        );

        if (!member) {
            throw new AppError('Membro não encontrado', 404, 'MEMBER_NOT_FOUND');
        }

        return mapMemberRowToMember(member);
    }

    async findByRole(role: string): Promise<Member[]> {
        const members = await query<MemberRow>(
            'SELECT * FROM members WHERE role = $1 ORDER BY name ASC',
            [role]
        );

        return members.map(mapMemberRowToMember);
    }

    async update(id: string, data: UpdateMemberDTO): Promise<Member> {
        // Verificar se o membro existe
        await this.findById(id);

        // Verificar email duplicado
        if (data.email) {
            const existing = await queryOne<MemberRow>(
                'SELECT id FROM members WHERE email = $1 AND id != $2',
                [data.email, id]
            );
            if (existing) {
                throw new AppError('Já existe um membro com este email', 400, 'EMAIL_EXISTS');
            }
        }

        // Montar query de update dinâmica
        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(data.name);
        }
        if (data.role !== undefined) {
            updates.push(`role = $${paramIndex++}`);
            params.push(data.role);
        }
        if (data.phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            params.push(data.phone || null);
        }
        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            params.push(data.email || null);
        }
        if (data.notes !== undefined) {
            updates.push(`notes = $${paramIndex++}`);
            params.push(data.notes || null);
        }
        if (data.avatar !== undefined) {
            updates.push(`avatar = $${paramIndex++}`);
            params.push(data.avatar || null);
        }
        if (data.userId !== undefined) {
            updates.push(`user_id = $${paramIndex++}`);
            params.push(data.userId || null);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        params.push(id);
        const [member] = await query<MemberRow>(
            `UPDATE members SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        return mapMemberRowToMember(member);
    }

    async delete(id: string): Promise<void> {
        // Verificar se o membro existe
        await this.findById(id);

        await query('DELETE FROM members WHERE id = $1', [id]);
    }

    async getRoles(): Promise<string[]> {
        const result = await query<{ role: string }>(
            'SELECT DISTINCT role FROM members ORDER BY role ASC'
        );
        return result.map(r => r.role);
    }
}

export const memberService = new MemberService();
