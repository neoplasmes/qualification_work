import { createLocalJWKSet } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestKeyPair, signTestToken, type TestKeyPair } from '../test/signToken.ts';
import {
    ForbiddenOrgError,
    InvalidInternalAuthError,
    MissingInternalAuthError,
} from './errors.ts';
import { resolveIdentity } from './resolveIdentity.ts';
import { setKeyGetterForTesting } from './verify.ts';

const issuer = 'qw-auth';
const audience = 'qw-internal';
const jwksUrl = 'https://test/jwks-resolve.json';

let keys: TestKeyPair;

beforeAll(async () => {
    keys = await createTestKeyPair('resolve-kid');
    setKeyGetterForTesting(jwksUrl, createLocalJWKSet({ keys: [keys.publicJwk] }));
});

const baseOptions = { jwksUrl, issuer, audience };

describe('resolveIdentity', () => {
    it('401 when header is absent', async () => {
        await expect(resolveIdentity({}, baseOptions)).rejects.toBeInstanceOf(
            MissingInternalAuthError
        );
    });

    it('401 for a malformed token', async () => {
        await expect(
            resolveIdentity({ 'x-internal-auth': 'not.a.jwt' }, baseOptions)
        ).rejects.toBeInstanceOf(InvalidInternalAuthError);
    });

    it('returns identity for a valid token', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [{ id: '1', role: 'owner' }] },
            issuer: issuer,
            audience: audience,
        });

        await expect(
            resolveIdentity({ 'x-internal-auth': token }, baseOptions)
        ).resolves.toEqual({ userId: '1', orgs: [{ id: '1', role: 'owner' }] });
    });

    it('accepts Bearer prefix', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: 'u2', orgs: [] },
            issuer: issuer,
            audience: audience,
        });

        const identity = await resolveIdentity(
            { 'x-internal-auth': `Bearer ${token}` },
            baseOptions
        );
        expect(identity.userId).toBe('u2');
    });

    it('403 when orgId is not in claims', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [{ id: '1', role: 'owner' }] },
            issuer: issuer,
            audience: audience,
        });

        await expect(
            resolveIdentity({ 'x-internal-auth': token }, { ...baseOptions, orgId: 'o2' })
        ).rejects.toBeInstanceOf(ForbiddenOrgError);
    });

    it('ok when orgId is not required', async () => {
        const token = await signTestToken({
            keyPair: keys,
            identity: { userId: '1', orgs: [] },
            issuer: issuer,
            audience: audience,
        });

        await expect(
            resolveIdentity({ 'x-internal-auth': token }, baseOptions)
        ).resolves.toBeDefined();
    });
});
