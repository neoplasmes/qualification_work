import type {
    OrgMembership,
    OrgRole,
} from '@qualification-work/microservice-utils/internalAuth';

import { ForbiddenError } from '@/core/errors';

const writableRoles: OrgRole[] = ['owner', 'editor'];

export function getReadableOrgIds(orgs: OrgMembership[]): string[] {
    return orgs.map(({ id }) => id);
}

export function getWritableOrgIds(orgs: OrgMembership[]): string[] {
    return orgs.filter(({ role }) => writableRoles.includes(role)).map(({ id }) => id);
}

export function getOwnerOrgIds(orgs: OrgMembership[]): string[] {
    return orgs.filter(({ role }) => role === 'owner').map(({ id }) => id);
}

export function checkOrgMembership(orgs: OrgMembership[], orgId: string): void {
    if (!getReadableOrgIds(orgs).includes(orgId)) {
        throw new ForbiddenError(`User is not a member of org ${orgId}`);
    }
}

export function checkWritableOrgMembership(orgs: OrgMembership[], orgId: string): void {
    if (!getWritableOrgIds(orgs).includes(orgId)) {
        throw new ForbiddenError(`User cannot modify org ${orgId}`);
    }
}
