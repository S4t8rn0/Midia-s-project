import { Request, Response } from 'express';
import { z } from 'zod';
import { memberService } from '../services/memberService';

const createMemberSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    role: z.string().min(1, 'Função é obrigatória'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
    avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
    userId: z.string().uuid('ID do usuário inválido').optional(),
});

const updateMemberSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    role: z.string().min(1, 'Função é obrigatória').optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
    avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
    userId: z.string().uuid('ID do usuário inválido').optional().nullable(),
});

const listMembersSchema = z.object({
    search: z.string().optional(),
    role: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class MemberController {
    async create(req: Request, res: Response) {
        const data = createMemberSchema.parse(req.body);

        // Limpar strings vazias para undefined
        const cleanData = {
            ...data,
            email: data.email || undefined,
            avatar: data.avatar || undefined,
        };

        const member = await memberService.create(cleanData);

        res.status(201).json({
            message: 'Membro criado com sucesso',
            member,
        });
    }

    async findAll(req: Request, res: Response) {
        const filters = listMembersSchema.parse(req.query);

        const result = await memberService.findAll(filters);

        res.json(result);
    }

    async findById(req: Request, res: Response) {
        const { id } = req.params;

        const member = await memberService.findById(id);

        res.json({ member });
    }

    async findByRole(req: Request, res: Response) {
        const { role } = req.params;

        const members = await memberService.findByRole(role);

        res.json({ members });
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = updateMemberSchema.parse(req.body);

        // Limpar strings vazias para undefined
        const cleanData = {
            ...data,
            email: data.email || undefined,
            avatar: data.avatar || undefined,
            userId: data.userId === null ? undefined : data.userId,
        };

        const member = await memberService.update(id, cleanData);

        res.json({
            message: 'Membro atualizado com sucesso',
            member,
        });
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        await memberService.delete(id);

        res.json({ message: 'Membro removido com sucesso' });
    }

    async getRoles(req: Request, res: Response) {
        const roles = await memberService.getRoles();

        res.json({ roles });
    }
}

export const memberController = new MemberController();
