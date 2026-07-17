import type { Session } from '@/core/entities/user';

import type { ReadOptions } from '../readOptions';

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput extends LoginInput {
    name: string;
    family: string;
}

export interface RegisterResult {
    id: string;
}

export interface SessionRepo {
    getSession(options?: ReadOptions): Promise<Session>;
    register(input: RegisterInput): Promise<RegisterResult>;
    login(input: LoginInput): Promise<void>;
    logout(): Promise<void>;
}
