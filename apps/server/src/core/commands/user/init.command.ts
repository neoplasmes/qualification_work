import type { UserRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class InitUserCommand implements Executable<
    [string, string],
    Promise<{ initialized: boolean; orgId: string | null }>
> {
    constructor(private readonly userRepo: UserRepo) {}

    async execute(userId: string, username: string) {
        return this.userRepo.initialize({
            userId,
            orgDisplayName: `${username}'s organization`,
        });
    }
}

export type InitUserCommandIO = ExecutableIO<InitUserCommand>;
