import type { LoginInput, SessionRepo } from '@/app/ports/repos/session';

import type { Command } from '../command';

export function createLogin(repo: SessionRepo): Command<LoginInput, void> {
    return {
        execute: input => repo.login(input),
        writes: () => ['session', 'user', 'organization'],
    };
}
