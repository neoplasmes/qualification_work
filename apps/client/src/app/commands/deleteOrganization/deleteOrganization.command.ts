import type { DeleteOrgInput, OrganizationRepo } from '@/app/ports/repos/organization';

import type { Command } from '../command';

export function createDeleteOrganization(
    repo: OrganizationRepo
): Command<DeleteOrgInput, void> {
    return {
        execute: input => repo.deleteOrganization(input),
        writes: () => ['session', 'organization'],
    };
}
