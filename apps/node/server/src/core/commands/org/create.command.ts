import type { OrgRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class CreateOrgCommand implements Executable<
    [string, string],
    Promise<{ id: string }>
> {
    constructor(private readonly orgRepo: OrgRepo) {}

    async execute(name: string, ownerId: string) {
        return this.orgRepo.create({ name, ownerId });
    }
}

export type CreateOrgCommandIO = ExecutableIO<CreateOrgCommand>;
