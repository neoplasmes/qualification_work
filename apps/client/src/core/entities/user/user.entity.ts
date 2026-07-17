import type { Entity } from '../entity';

export interface User extends Entity {
    readonly ref: `user:${string}`;
    id: string;
    email: string;
    name: string;
    family: string;
}
