import type {
    OrgMembership,
    OrgRole,
} from '@qualification-work/microservice-utils/internalAuth';

import { ForbiddenError } from '@/core/errors';

const writableRoles: OrgRole[] = ['owner', 'editor'];

export function checkOrgMembership(orgs: OrgMembership[], orgId: string): void {
    if (!orgs.some(org => org.id === orgId)) {
        throw new ForbiddenError(`User is not a member of org ${orgId}`);
    }
}

export function checkWritableOrgMembership(orgs: OrgMembership[], orgId: string): void {
    if (!orgs.some(org => org.id === orgId && writableRoles.includes(org.role))) {
        throw new ForbiddenError(`User cannot modify org ${orgId}`);
    }
}
