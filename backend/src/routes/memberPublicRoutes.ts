import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// Listar membros
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM profiles ORDER BY name');
        res.json({ members: result });
    } catch (error: any) {
        console.error('Erro ao listar membros:', error.message);
        res.status(500).json({ error: 'Falha ao listar membros' });
    }
});

// Criar membro
router.post('/', async (req: Request, res: Response) => {
    const { name, roles, phone, email } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    try {
        const id = crypto.randomUUID();
        const memberEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@membro.local`;
        const memberRoles = roles && Array.isArray(roles) && roles.length > 0 ? roles : ['Voluntário'];

        const result = await query(
            `INSERT INTO profiles (id, name, email, role, roles, phone)
             VALUES ($1, $2, $3, 'member', $4, $5)
             RETURNING *`,
            [id, name, memberEmail, JSON.stringify(memberRoles), phone || null]
        );

        res.status(201).json({ profile: result[0] });
    } catch (error: any) {
        console.error('Erro ao criar membro:', error.message);
        res.status(500).json({ error: 'Falha ao criar membro' });
    }
});

// Atualizar membro
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, roles, phone } = req.body;

    try {
        const updates: string[] = [];
        const params: any[] = [];
        let idx = 1;

        if (name) { updates.push(`name = $${idx++}`); params.push(name); }
        if (roles && Array.isArray(roles)) { updates.push(`roles = $${idx++}`); params.push(JSON.stringify(roles)); }
        if (phone !== undefined) { updates.push(`phone = $${idx++}`); params.push(phone || null); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar' });
        }

        params.push(id);
        const result = await query(
            `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            params
        );

        if (result.length === 0) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        res.json({ profile: result[0] });
    } catch (error: any) {
        console.error('Erro ao atualizar membro:', error.message);
        res.status(500).json({ error: 'Falha ao atualizar membro' });
    }
});

// Deletar membro pelo ID (via SQL direto - bypass RLS)
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Primeiro remove referências em event_schedules
        await query('DELETE FROM event_schedules WHERE member_id = $1', [id]).catch(() => { });

        // Depois remove o profile
        const result = await query('DELETE FROM profiles WHERE id = $1 RETURNING id', [id]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Membro não encontrado' });
        }

        res.json({ message: 'Membro removido com sucesso', id });
    } catch (error: any) {
        console.error('Erro ao deletar membro:', error.message);
        res.status(500).json({ error: 'Falha ao remover membro' });
    }
});

export default router;
