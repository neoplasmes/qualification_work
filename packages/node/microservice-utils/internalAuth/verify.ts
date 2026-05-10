import {
    createRemoteJWKSet,
    jwtVerify,
    type JWTPayload,
    type JWTVerifyGetKey,
} from 'jose';
import { z } from 'zod';

import { InvalidInternalAuthError } from './errors.ts';
import type { InternalIdentity, OrgMembership, VerifyOptions } from './types.ts';

const orgSchema = z.object({
    id: z.string().min(1),
    role: z.string().min(1),
});

const claimsSchema = z.object({
    sub: z.string().min(1),
    orgs: z.array(orgSchema).default([]),
});

const keyGetters = new Map<string, JWTVerifyGetKey>();

function getKeyGetter(jwksUrl: string): JWTVerifyGetKey {
    let getter = keyGetters.get(jwksUrl);
    if (!getter) {
        getter = createRemoteJWKSet(new URL(jwksUrl));
        keyGetters.set(jwksUrl, getter);
    }

    return getter;
}

/**
 * Description placeholder
 *
 * @export
 * @async
 * @param {string} token
 * @param {VerifyOptions} opts
 * @returns {Promise<InternalIdentity>}
 */
export async function verifyInternalAuth(
    token: string,
    opts: VerifyOptions
): Promise<InternalIdentity> {
    const getKey = getKeyGetter(opts.jwksUrl);

    let payload: JWTPayload;
    try {
        const result = await jwtVerify(token, getKey, {
            issuer: opts.issuer,
            audience: opts.audience,
            algorithms: ['RS256'],
        });
        payload = result.payload;
    } catch (err) {
        throw new InvalidInternalAuthError(
            err instanceof Error ? err.message : 'verification failed'
        );
    }

    const parsed = claimsSchema.safeParse(payload);
    if (!parsed.success) {
        throw new InvalidInternalAuthError('claims payload is malformed');
    }

    return {
        userId: parsed.data.sub,
        orgs: parsed.data.orgs as OrgMembership[],
    };
}

// TODO: remove somewhere else when i'll have a time
export function setKeyGetterForTesting(jwksUrl: string, getter: JWTVerifyGetKey): void {
    keyGetters.set(jwksUrl, getter);
}

export function resetKeyGettersForTesting(): void {
    keyGetters.clear();
}
