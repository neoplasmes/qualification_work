import type { MeCacheRepository, SessionRepository } from '@/core/ports';
import { meSchema, type MeHandler } from '@/core/queries';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

export function createMeHandler(
    handler: MeHandler,
    meCacheRepository: MeCacheRepository,
    sessionRepo: SessionRepository
): RequestHandlerType {
    return async ({ state, response }) => {
        const token = state.cookies['session'] ?? '';

        const input = parseWithZod(() => meSchema.parse({ token }));

        const session = await sessionRepo.find(token);
        if (session) {
            const cachedResult = await meCacheRepository.findByUserId(session.userId);
            if (cachedResult) {
                return response.status(200).json(cachedResult);
            }
        }

        const result = await handler.execute(input);

        response.status(200).json(result);

        // We don't wait to this promise because it is more critical to return the reponse
        // as fast as possible.
        void meCacheRepository.save(result.id, result).catch((err: unknown) => {
            console.error('Failed to save /me cache', err);
        });
    };
}
