import { NotFoundError } from '@/core/errors';
import type { OrganizationRepository } from '@/core/ports';

import type { DeleteOrgInput } from './types';

export class DeleteOrgHandler {
    constructor(private readonly organizationRepository: OrganizationRepository) {}

    async execute(input: DeleteOrgInput): Promise<void> {
        const organization = await this.organizationRepository.findById(input.id, [
            'ownerId',
        ]);

        if (!organization) {
            throw new NotFoundError(`Organization ${input.id} not found`);
        }

        await this.organizationRepository.delete(input.id);
    }
}
