import { UnauthorizedError } from '@/core/errors';
import type {
    OrganizationRepository,
    SessionRepository,
    UserRepository,
} from '@/core/ports';

import type { MeInput, MeOutput } from './types';

// TODO: think about some kinf of internal JWT??? (only for the internal server operations)
export class MeHandler {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly userRepository: UserRepository,
        private readonly orgRepository: OrganizationRepository
    ) {}

    async execute(input: MeInput): Promise<MeOutput> {
        // TODO: maybe all "me" data should be stored already in the session??
        /**
         * Research shown that there should be короче сессии кэшируются с одним префиксом
         * /me данные кэшируются с другим. Причём у этого кэша ограниченное количество памяти,
         * чтобы не было переполнения оперативки, и нужно сначала обращаться в кэш, а затем уже идти в postrges,
         * если в кэше данных не было. После обращения в pg, отправляем данные юзеру, а сами асинхронно сохраняем этот кэш.
         *
         */
        const session = await this.sessionRepository.find(input.token);

        if (!session) {
            throw new UnauthorizedError('');
        }

        const user = await this.userRepository.findById(session.userId, [
            'id',
            'email',
            'name',
            'family',
        ]);

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        const organizations = await this.orgRepository.findByUserId(session.userId);

        return { ...user, organizations };
    }
}
