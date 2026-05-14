import type { OrgRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

// TODO: track the flow of the objects to understand, whether there is a preformance issue
export class CreateOrgCommand implements Executable<
    [string, string, string],
    Promise<{ id: string }>
> {
    constructor(private readonly orgRepo: OrgRepo) {}

    async execute(name: string, displayName: string, ownerId: string) {
        return this.orgRepo.create({ name, displayName, ownerId });
    }
}

export type CreateOrgCommandIO = ExecutableIO<CreateOrgCommand>;
