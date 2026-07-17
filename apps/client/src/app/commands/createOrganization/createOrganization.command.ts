import type {
    CreateOrgInput,
    CreateOrgResult,
    OrganizationRepo,
} from '@/app/ports/repos/organization';

import type { Command } from '../command';

export function createCreateOrganization(
    repo: OrganizationRepo
): Command<CreateOrgInput, CreateOrgResult> {
    return {
        execute: input => repo.createOrganization(input),
        writes: () => ['session', 'organization'],
    };
}
