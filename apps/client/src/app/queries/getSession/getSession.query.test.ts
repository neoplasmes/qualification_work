import { createGetSession } from '.';
import type { Session } from '@/core/entities/user';
import { describe, expect, it, vi } from 'vitest';

import { createCreateOrganization } from '@/app/commands/createOrganization';
import { createDeleteOrganization } from '@/app/commands/deleteOrganization';
import { createLogin } from '@/app/commands/login';
import { createLogout } from '@/app/commands/logout';
import { createRegister } from '@/app/commands/register';
import type { OrganizationRepo } from '@/app/ports/repos/organization';
import type { SessionRepo } from '@/app/ports/repos/session';

const session: Session = {
    user: {
        ref: 'user:user-1',
        id: 'user-1',
        email: 'user@example.com',
        name: 'First',
        family: 'Last',
    },
    organizations: [
        { ref: 'organization:org-1', id: 'org-1', name: 'Display', role: 'owner' },
    ],
    isInitializing: false,
};

describe('session and organization operations', () => {
    it('executes reads and commands with plain ports', async () => {
        const options = {};
        const calls: unknown[] = [];
        const repo: SessionRepo = {
            async getSession(options) {
                calls.push(['session', options]);

                return session;
            },
            async register(input) {
                calls.push(['register', input]);

                return { id: 'new-user' };
            },
            async login(input) {
                calls.push(['login', input]);
            },
            async logout() {
                calls.push(['logout']);
            },
        };
        const orgRepo: OrganizationRepo = {
            async createOrganization(input) {
                calls.push(['create', input]);

                return { id: 'new-org' };
            },
            async deleteOrganization(input) {
                calls.push(['delete', input]);
            },
        };
        const getSession = createGetSession(repo);
        const register = createRegister(repo);
        const login = createLogin(repo);
        const logout = createLogout(repo);
        const createOrganization = createCreateOrganization(orgRepo);
        const deleteOrganization = createDeleteOrganization(orgRepo);
        const input = {
            email: 'user@example.com',
            password: 'password',
            name: 'First',
            family: 'Last',
        };
        const orgInput = { name: 'slug', displayName: 'Display', ownerId: 'user-1' };

        await expect(getSession.execute(undefined, options)).resolves.toBe(session);
        await expect(register.execute(input)).resolves.toEqual({ id: 'new-user' });
        await expect(login.execute(input)).resolves.toBeUndefined();
        await expect(logout.execute(undefined)).resolves.toBeUndefined();
        await expect(createOrganization.execute(orgInput)).resolves.toEqual({
            id: 'new-org',
        });
        await expect(
            deleteOrganization.execute({ orgId: 'old-org' })
        ).resolves.toBeUndefined();
        expect(calls).toEqual([
            ['session', options],
            ['register', input],
            ['login', input],
            ['logout'],
            ['create', orgInput],
            ['delete', { orgId: 'old-org' }],
        ]);
        expect(getSession.name).toBe('getSession');
        expect(getSession.reads(undefined)).toEqual(['session']);
        expect(register.writes(input, { id: 'new-user' })).toEqual(['user']);
        expect(login.writes(input, undefined)).toEqual([
            'session',
            'user',
            'organization',
        ]);
        expect(logout.writes(undefined, undefined)).toEqual([
            'session',
            'user',
            'organization',
        ]);
        expect(createOrganization.writes(orgInput, { id: 'new-org' })).toEqual([
            'session',
            'organization',
        ]);
        expect(deleteOrganization.writes({ orgId: 'old-org' }, undefined)).toEqual([
            'session',
            'organization',
        ]);
    });

    it('preserves a port failure without invoking unrelated operations', async () => {
        const failure = new Error('port failed');
        const repo: SessionRepo = {
            getSession: vi.fn().mockRejectedValue(failure),
            register: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
        };
        await expect(createGetSession(repo).execute(undefined)).rejects.toBe(failure);
        expect(repo.login).not.toHaveBeenCalled();
        expect(repo.register).not.toHaveBeenCalled();
    });
});
