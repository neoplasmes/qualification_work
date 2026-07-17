import type { Session } from '@/core/entities/user';

import type { SessionRepo } from '@/app/ports/repos/session';

import type { Query } from '../query';

export function createGetSession(repo: SessionRepo): Query<void, Session> {
    return {
        name: 'getSession',
        execute: (_input, options) => repo.getSession(options),
        reads: () => ['session'],
    };
}
