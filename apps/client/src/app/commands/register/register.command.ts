import type {
    RegisterInput,
    RegisterResult,
    SessionRepo,
} from '@/app/ports/repos/session';

import type { Command } from '../command';

export function createRegister(
    repo: SessionRepo
): Command<RegisterInput, RegisterResult> {
    return {
        execute: input => repo.register(input),
        writes: () => ['user'],
    };
}
