import type { SessionRepository } from '@/core/ports';

import type { AuthState } from '@/shared/appState';

// TODO: i think this and appState and everything from /common folder should be moved closer to the implemetation layer))
/**
 * function to extract basic auth state for a user
 *
 * @export
 * @async
 * @param {SessionRepository} sessionRepo
 * @param {string} sessionToken
 * @returns {Promise<AuthState>}
 */
export async function resolveRequestAuth(
    sessionRepo: SessionRepository,
    sessionToken: string
): Promise<AuthState> {
    if (!sessionToken) {
        return {
            authenticated: false,
            userId: null,
        };
    }

    const session = await sessionRepo.find(sessionToken);

    if (!session) {
        return {
            authenticated: false,
            userId: null,
        };
    }

    return {
        authenticated: true,
        userId: session.userId,
    };
}
