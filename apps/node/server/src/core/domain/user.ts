/**
 * Тип из DB
 */
export interface User {
    id: string;
    email: string;
    login: string | null;
    passwordHash: string;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    name: string;
    family: string;
    createdAt: Date;
    updatedAt: Date;
}
