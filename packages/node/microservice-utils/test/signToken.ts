import { exportJWK, generateKeyPair, SignJWT, type JWK, type KeyLike } from 'jose';

import type { InternalIdentity } from '../internalAuth/types.ts';

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
    ttlSeconds?: number;
    expiredBySeconds?: number;
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
    const ttl = input.ttlSeconds ?? 300;
    const exp = input.expiredBySeconds ? now - input.expiredBySeconds : now + ttl;

    return new SignJWT({ orgs: input.identity.orgs })
        .setProtectedHeader({ alg: 'RS256', kid: input.keyPair.kid, typ: 'JWT' })
        .setSubject(input.identity.userId)
        .setIssuer(input.issuer)
        .setAudience(input.audience)
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(input.keyPair.privateKey);
}
