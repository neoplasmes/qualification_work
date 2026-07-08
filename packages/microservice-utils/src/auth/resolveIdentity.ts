import {
    ForbiddenOrgError,
    InvalidInternalAuthError,
    MissingInternalAuthError,
} from './errors.ts';
import type { InternalIdentity, VerifyOptions } from './types.ts';
import { verifyInternalAuth } from './verify.ts';

const bearerPrefix = 'Bearer ';

export type ResolveIdentityOptions = VerifyOptions & {
    orgId?: string;
};

function extractToken(value: string | undefined): string | null {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.startsWith(bearerPrefix)) {
        const tail = trimmed.slice(bearerPrefix.length).trim();

        return tail || null;
    }

    return trimmed;
}

/**
 * Extracts JWT identity from header
 *
 * @export
 * @async
 * @param {Record<string, string | undefined>} headers
 * @param {ResolveIdentityOptions} opts
 * @returns {Promise<InternalIdentity>}
 */
export async function resolveIdentity(
    headers: Record<string, string | undefined>,
    opts: ResolveIdentityOptions
): Promise<InternalIdentity> {
    const token = extractToken(headers['x-internal-auth']);
    if (!token) {
        throw new MissingInternalAuthError();
    }

    let identity: InternalIdentity;
    try {
        identity = await verifyInternalAuth(token, opts);
    } catch (err) {
        if (err instanceof InvalidInternalAuthError) {
            throw err;
        }

        throw new InvalidInternalAuthError(
            err instanceof Error ? err.message : 'verification failed'
        );
    }

    if (opts.orgId && !identity.orgs.some(m => m.id === opts.orgId)) {
        throw new ForbiddenOrgError(opts.orgId);
    }

    return identity;
}
