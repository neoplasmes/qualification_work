import type { OrganizationRepository } from '@/core/ports';
import type { CreateOrgInput } from './types';

export class CreateOrgHandler {
    constructor(private readonly organizationRepository: OrganizationRepository) {}

    async execute(input: CreateOrgInput): Promise<{ id: string }> {
        return this.organizationRepository.create({
            name: input.name,
            ownerId: input.ownerId,
        });
    }
}
