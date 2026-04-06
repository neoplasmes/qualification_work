import { createHmac } from 'node:crypto';
import type { Hasher } from '@/core/ports';
import { argon2id, hash, verify } from 'argon2';

const ARGON2_OPTIONS = {
    type: argon2id,
    memoryCost: 32768,
    timeCost: 2,
    parallelism: 1,
} as const;

export class Argon2HasherService implements Hasher {
    constructor(private readonly pepper: string) {}

    private applyPepper(password: string): string {
        return createHmac('sha256', this.pepper).update(password).digest('hex');
    }

    async hashPassword(plain: string): Promise<string> {
        const peppered = this.applyPepper(plain);

        return hash(peppered, ARGON2_OPTIONS);
    }

    async verifyPassword(plain: string, hashed: string): Promise<boolean> {
        const peppered = this.applyPepper(plain);

        return verify(hashed, peppered);
    }
}
