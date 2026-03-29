import { createHmac } from 'node:crypto';
import { hash, verify } from 'argon2';

import type { Hasher } from '@/core/ports';

export class Argon2Hasher implements Hasher {
    constructor(private readonly pepper: string) {}

    async hashPassword(plain: string): Promise<string> {
        const peppered = this.applyPepper(plain);
        return hash(peppered);
    }

    async verifyPassword(plain: string, hashed: string): Promise<boolean> {
        const peppered = this.applyPepper(plain);
        return verify(hashed, peppered);
    }

    private applyPepper(password: string): string {
        return createHmac('sha256', this.pepper).update(password).digest('hex');
    }
}
