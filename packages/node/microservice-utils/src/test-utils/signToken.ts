import { exportJWK, generateKeyPair, SignJWT, type JWK, type KeyLike } from 'jose';

import type { InternalIdentity } from '../auth/index.ts';

export type TestKeyPair = {
    kid: string;
    privateKey: KeyLike;
    publicKey: KeyLike;
    publicJwk: JWK;
};

/**
 * Generates RSA key pair for tests.
 *
 * @export
 * @async
 * @param {string} [kid='test-key']
 * @returns {Promise<TestKeyPair>}
 */
export async function createTestKeyPair(kid = 'test-key'): Promise<TestKeyPair> {
    const { privateKey, publicKey } = await generateKeyPair('RS256', {
        extractable: true,
    });
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = kid;
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    return { kid, privateKey, publicKey, publicJwk };
}

export type SignTokenInput = {
    keyPair: TestKeyPair;
    identity: InternalIdentity;
    issuer: string;
    audience: string;
    ttlMs?: number;
    expiredByMs?: number;
};

/**
 * signs a mock test token
 *
 * @export
 * @async
 * @param {SignTokenInput} input
 * @returns {Promise<string>}
 */
export async function signTestToken(input: SignTokenInput): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const ttlForJwt = Math.ceil((input.ttlMs ?? 300_000) / 1000);
    const expiredByForJwt =
        input.expiredByMs === undefined ? undefined : Math.ceil(input.expiredByMs / 1000);
    const exp = expiredByForJwt === undefined ? now + ttlForJwt : now - expiredByForJwt;

    return new SignJWT({ orgs: input.identity.orgs })
        .setProtectedHeader({ alg: 'RS256', kid: input.keyPair.kid, typ: 'JWT' })
        .setSubject(input.identity.userId)
        .setIssuer(input.issuer)
        .setAudience(input.audience)
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(input.keyPair.privateKey);
}
