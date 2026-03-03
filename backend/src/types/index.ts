// ========================================
// TIPOS BASE
// ========================================

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'member';
    phone?: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Member {
    id: string;
    name: string;
    role: string; // Função na igreja (câmera, som, etc.)
    phone?: string;
    email?: string;
    notes?: string;
    avatar?: string;
    userId?: string; // Vincula ao usuário do sistema
    createdAt: Date;
    updatedAt: Date;
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    calendarId?: string;
    googleEventId?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventSchedule {
    id: string;
    eventId: string;
    memberId: string;
    role: string; // Função no evento
    confirmed: boolean;
    createdAt: Date;
}

export interface KanbanTask {
    id: string;
    title: string;
    description?: string;
    status: 'ideas' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigneeId?: string;
    position: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MediaFile {
    id: string;
    name: string;
    url: string;
    publicId?: string; // Cloudinary public_id
    type: 'image' | 'video' | 'document';
    size: number;
    mimeType: string;
    tags?: string[];
    uploaderId: string;
    createdAt: Date;
}

// ========================================
// TIPOS DE REQUEST/RESPONSE
// ========================================

export interface TokenPayload {
    userId: string;
    email: string;
    role: 'admin' | 'member';
}

export interface AuthResponse {
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ========================================
// TIPOS DO EXPRESS EXTENDIDOS
// ========================================

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
