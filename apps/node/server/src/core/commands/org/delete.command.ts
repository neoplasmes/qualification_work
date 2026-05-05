import { NotFoundError } from '@/core/errors';
import type { OrgRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class DeleteOrgCommand implements Executable<[string], Promise<void>> {
    constructor(private readonly orgRepo: OrgRepo) {}

    async execute(id: string) {
        const organization = await this.orgRepo.findById(id, ['ownerId']);

        if (!organization) {
            throw new NotFoundError(`Organization ${id} not found`);
        }

        await this.orgRepo.delete(id);
    }
}

export type DeleteOrgCommandIO = ExecutableIO<DeleteOrgCommand>;
