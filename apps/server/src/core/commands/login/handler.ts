import { UnauthorizedError } from '@/core/errors';
import type { Hasher, SessionRepository, UserRepository } from '@/core/ports';

import type { LoginInput } from './types';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export class LoginHandler {
    constructor(
        /**
         * Репозиторий, работающий с данными пользователя
         */
        private readonly userRepository: UserRepository,
        /**
         * Репозиторий сессий (Redis)
         */
        private readonly sessionRepository: SessionRepository,
        /**
         * Сервис шифрования/верификации паролей
         */
        private readonly hasher: Hasher
    ) {}

    async execute(input: LoginInput): Promise<{ token: string }> {
        const user = await this.userRepository.findByEmail(input.email, [
            'id',
            'passwordHash',
        ]);

        if (!user) {
            throw new UnauthorizedError('');
        }

        const valid = await this.hasher.verifyPassword(input.password, user.passwordHash);

        if (!valid) {
            throw new UnauthorizedError('');
        }

        return this.sessionRepository.create({ userId: user.id });
    }
}
