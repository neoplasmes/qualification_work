import { ConflictError } from '@/core/errors';
import type { Hasher, UserRepository } from '@/core/ports';

import type { RegisterInput } from './types';

/**
 * Регистрирует пользователя.
 * В соответствии с CQRS всё вызывается через execute
 */
export class RegisterHandler {
    constructor(
        /**
         * Репозиторий, работающий с данными пользователя
         */
        private readonly userRepository: UserRepository,
        /**
         * Сервис, обслуживающий шифрование/дешифрование/верификацию
         */
        private readonly hasher: Hasher
    ) {}

    async execute(input: RegisterInput): Promise<void> {
        const existingLogin = await this.userRepository.findByLogin(input.login);

        if (existingLogin) {
            throw new ConflictError(`Login ${input.login} уже занят`);
        }

        const passwordHash = await this.hasher.hashPassword(input.password);

        this.userRepository.create({
            login: input.login,
            passwordHash,
            name: input.name,
            family: input.family,
        });
    }
}
