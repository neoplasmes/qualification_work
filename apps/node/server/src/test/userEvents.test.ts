import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
    createTestUser,
    dbQuery,
    publishUserRegisteredEvent,
    startServer,
    stopServer,
    truncate,
    waitFor,
} from './setup';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('init user tool', () => {
    it('creates initial organization from Redis Stream event', async () => {
        const user = await createTestUser({ name: 'Alice', isInitializing: true });

        await publishUserRegisteredEvent({ userId: user.id, username: user.name });

        await waitFor(async () => {
            const rows = await dbQuery<{ is_initializing: boolean }>(
                `SELECT is_initializing FROM auth.users WHERE id = $1`,
                [user.id]
            );

            return rows[0]?.is_initializing === false;
        });

        const organizations = await dbQuery<{
            id: string;
            name: string;
            display_name: string;
        }>(`SELECT id, name, display_name FROM orgs.organizations WHERE owner_id = $1`, [
            user.id,
        ]);
        expect(organizations).toHaveLength(1);
        expect(organizations[0].display_name).toBe("Alice's organization");
        expect(organizations[0].name).toHaveLength(32);

        const roles = await dbQuery<{ role: string }>(
            `SELECT role FROM orgs.roles WHERE org_id = $1 AND user_id = $2`,
            [organizations[0].id, user.id]
        );
        expect(roles).toEqual([{ role: 'owner' }]);
    });

    it('handles duplicate delivery without creating another organization', async () => {
        const user = await createTestUser({ name: 'Repeat', isInitializing: true });

        await publishUserRegisteredEvent({ userId: user.id, username: user.name });
        await publishUserRegisteredEvent({ userId: user.id, username: user.name });

        await waitFor(async () => {
            const organizations = await dbQuery<{ count: string }>(
                `SELECT count(*) FROM orgs.organizations WHERE owner_id = $1`,
                [user.id]
            );

            return organizations[0]?.count === '1';
        });

        const users = await dbQuery<{ is_initializing: boolean }>(
            `SELECT is_initializing FROM auth.users WHERE id = $1`,
            [user.id]
        );
        expect(users).toEqual([{ is_initializing: false }]);
    });

    it('reconciles initializing users even without Redis event', async () => {
        const user = await createTestUser({ name: 'LostEvent', isInitializing: true });

        await waitFor(async () => {
            const organizations = await dbQuery<{ display_name: string }>(
                `SELECT display_name FROM orgs.organizations WHERE owner_id = $1`,
                [user.id]
            );

            return organizations[0]?.display_name === "LostEvent's organization";
        });

        const users = await dbQuery<{ is_initializing: boolean }>(
            `SELECT is_initializing FROM auth.users WHERE id = $1`,
            [user.id]
        );
        expect(users).toEqual([{ is_initializing: false }]);
    });
});
