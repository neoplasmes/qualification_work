import type { InternalIdentity, OrgMembership } from '../internalAuth/types.ts';

/**
 * Builds fake internal identity for unit tests.
 *
 * @export
 * @param {Partial<InternalIdentity>} [overrides={}]
 * @returns {InternalIdentity}
 */
export function mockInternalIdentity(
    overrides: Partial<InternalIdentity> = {}
): InternalIdentity {
    const orgs: OrgMembership[] = overrides.orgs ?? [{ id: 'test-org', role: 'owner' }];

    return {
        userId: overrides.userId ?? 'test-user',
        orgs,
    };
}
