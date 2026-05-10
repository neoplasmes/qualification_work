import { createLocalJWKSet } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestKeyPair, signTestToken, type TestKeyPair } from '../test/index.ts';
import { InvalidInternalAuthError } from './errors.ts';
import type { VerifyOptions } from './types.ts';
import {
    resetKeyGettersForTesting,
    setKeyGetterForTesting,
    verifyInternalAuth,
} from './verify.ts';

const issuer = 'qw-auth';
const audience = 'qw-internal';
const jwksUrl = 'https://test/jwks.json';

const baseOptions: VerifyOptions = { issuer, audience, jwksUrl };

let keys: TestKeyPair;

beforeAll(async () => {
    keys = await createTestKeyPair('kid-1');
    const localGetter = createLocalJWKSet({ keys: [keys.publicJwk] });
    setKeyGetterForTesting(jwksUrl, localGetter);
});

describe('verifyInternalAuth', () => {
    it('returns identity for a valid token', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [{ id: '1', role: 'owner' }] },
            issuer,
            audience,
        });

        const identity = await verifyInternalAuth(token, baseOptions);

        expect(identity).toEqual({
            userId: '1',
            orgs: [{ id: '1', role: 'owner' }],
        });
    });

    it('throws InvalidInternalAuthError for an expired token', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [] },
            issuer,
            audience,
            expiredBySeconds: 60,
        });

        await expect(verifyInternalAuth(token, baseOptions)).rejects.toBeInstanceOf(
            InvalidInternalAuthError
        );
    });

    it('throws on wrong issuer', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [] },
            issuer: 'other-iss',
            audience,
        });

        await expect(verifyInternalAuth(token, baseOptions)).rejects.toBeInstanceOf(
            InvalidInternalAuthError
        );
    });

    it('throws on wrong audience', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [] },
            issuer,
            audience: 'other-aud',
        });

        await expect(verifyInternalAuth(token, baseOptions)).rejects.toBeInstanceOf(
            InvalidInternalAuthError
        );
    });

    it('throws when signed with an unknown key', async () => {
        const otherKeys = await createTestKeyPair('kid-other');
        const token = await signTestToken({
            keyPair: otherKeys,
            identity: { userId: '1', orgs: [] },
            issuer,
            audience,
        });

        await expect(verifyInternalAuth(token, baseOptions)).rejects.toBeInstanceOf(
            InvalidInternalAuthError
        );
    });

    it('cache reset does not break the next call', () => {
        resetKeyGettersForTesting();
        const localGetter = createLocalJWKSet({ keys: [keys.publicJwk] });
        setKeyGetterForTesting(jwksUrl, localGetter);
    });
});
