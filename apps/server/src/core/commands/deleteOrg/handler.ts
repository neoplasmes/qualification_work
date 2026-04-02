import { NotFoundError } from '@/core/errors';
import type { OrganizationRepository } from '@/core/ports';
import type { DeleteOrgInput } from './types';

export class DeleteOrgHandler {
    constructor(private readonly organizationRepository: OrganizationRepository) {}

    async execute(input: DeleteOrgInput): Promise<void> {
        const exists = await this.organizationRepository.findById(input.id);

        if (!exists) {
            throw new NotFoundError(`Organization ${input.id} not found`);
        }

        await this.organizationRepository.delete(input.id);
    }
}
