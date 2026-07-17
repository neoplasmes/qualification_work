import type { SessionRepo } from '@/app/ports/repos/session';

import type { Command } from '../command';

export function createLogout(repo: SessionRepo): Command<void, void> {
    return {
        execute: () => repo.logout(),
        writes: () => ['session', 'user', 'organization'],
    };
}
