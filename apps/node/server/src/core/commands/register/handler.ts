import { ConflictError } from '@/core/errors';
import type { Hasher, OrganizationRepository, UserRepository } from '@/core/ports';

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
         * Репозиторий организаций
         */
        private readonly organizationRepository: OrganizationRepository,
        /**
         * Сервис, обслуживающий шифрование/дешифрование/верификацию
         */
        private readonly hasher: Hasher
    ) {}

    async execute(input: RegisterInput): Promise<{ id: string }> {
        const exists = await this.userRepository.findByEmail(input.email);

        if (exists) {
            throw new ConflictError(`Email ${input.email} is already in use`);
        }

        const passwordHash = await this.hasher.hashPassword(input.password);

        const { id } = await this.userRepository.create({
            login: input.email,
            passwordHash,
            name: input.name,
            family: input.family,
        });

        await this.organizationRepository.create({
            name: `${input.name}'s organization`,
            ownerId: id,
        });

        return { id };
    }
}
