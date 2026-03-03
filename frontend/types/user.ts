export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
    phone?: string;
    avatar?: string;
    created_at?: string;
}
