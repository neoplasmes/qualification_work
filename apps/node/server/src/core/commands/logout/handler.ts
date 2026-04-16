import type { SessionRepository } from '@/core/ports/repositories';

import type { LogoutInput } from './types';

export class LogoutHandler {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async execute(input: LogoutInput): Promise<void> {
        await this.sessionRepository.delete(input.token);
    }
}
