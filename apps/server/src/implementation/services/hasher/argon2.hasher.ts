import { createHmac } from 'node:crypto';
import type { Hasher } from '@/core/ports';
import { hash, verify } from 'argon2';

export class Argon2Hasher implements Hasher {
    constructor(private readonly pepper: string) {}

    private applyPepper(password: string): string {
        return createHmac('sha256', this.pepper).update(password).digest('hex');
    }

    async hashPassword(plain: string): Promise<string> {
        const peppered = this.applyPepper(plain);

        return hash(peppered);
    }

    async verifyPassword(plain: string, hashed: string): Promise<boolean> {
        const peppered = this.applyPepper(plain);

        return verify(hashed, peppered);
    }
}
