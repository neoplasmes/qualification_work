import { HttpOrganizationRepo } from '.';
import { HttpSessionRepo } from '@/env/repos/session';
import {
    ContractViolationError,
    HttpError,
    HttpTransport,
    NetworkError,
} from '@/env/transport/http';
import { describe, expect, it, vi } from 'vitest';

import { OrganizationError } from '@/app/ports/repos/organization';

describe('organization repository', () => {
    it('keeps the create payload and encodes deletion identity', async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(Response.json({ id: 'new-org' }, { status: 201 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }));
        const repo = new HttpOrganizationRepo(
            new HttpTransport({ baseUrl: '/api', fetch })
        );
        const input = { name: 'slug', displayName: 'Visible name', ownerId: 'owner-id' };

        await expect(repo.createOrganization(input)).resolves.toEqual({ id: 'new-org' });
        await expect(
            repo.deleteOrganization({ orgId: 'org/with space' })
        ).resolves.toBeUndefined();
        expect(
            fetch.mock.calls.map(([url, init]) => [
                url,
                init?.method,
                init?.body,
                init?.credentials,
            ])
        ).toEqual([
            ['/api/orgs', 'POST', JSON.stringify(input), 'include'],
            ['/api/orgs/org%2Fwith%20space', 'DELETE', undefined, 'include'],
        ]);
    });

    it('rejects malformed receipts', async () => {
        const repo = new HttpOrganizationRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: 1 })),
            })
        );
        await expect(
            repo.createOrganization({
                name: 'slug',
                displayName: 'Name',
                ownerId: 'owner',
            })
        ).rejects.toBeInstanceOf(ContractViolationError);
    });

    it.each([
        [400, 'validation'],
        [401, 'unauthenticated'],
        [404, 'notFound'],
        [409, 'conflict'],
    ])('maps known organization status %s', async (status, code) => {
        const repo = new HttpOrganizationRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockResolvedValue(
                        Response.json(
                            { error: 'failure', fields: ['name'] },
                            { status: Number(status) }
                        )
                    ),
            })
        );
        const error = await repo
            .deleteOrganization({ orgId: 'org' })
            .catch((error: unknown) => error);
        expect(error).toBeInstanceOf(OrganizationError);
        expect(error).toMatchObject({
            code,
            status,
            cause: expect.any(HttpError),
            fields: ['name'],
        });
    });

    it('notifies the session on authenticated organization expiration', async () => {
        const transport = new HttpTransport({
            baseUrl: '/api',
            fetch: vi
                .fn<typeof fetch>()
                .mockResolvedValue(new Response('expired', { status: 401 })),
        });
        const session = new HttpSessionRepo(transport);
        const onExpired = vi.fn();
        session.attachInterceptors({ onExpired });
        const repo = new HttpOrganizationRepo(transport);
        await expect(repo.deleteOrganization({ orgId: 'org' })).rejects.toMatchObject({
            code: 'unauthenticated',
        });
        expect(onExpired).toHaveBeenCalledTimes(1);
    });

    it('preserves network and server failures', async () => {
        const repo = new HttpOrganizationRepo(
            new HttpTransport({
                baseUrl: '/api',
                fetch: vi
                    .fn<typeof fetch>()
                    .mockRejectedValueOnce(new TypeError('offline'))
                    .mockResolvedValueOnce(new Response('', { status: 500 })),
            })
        );
        await expect(repo.deleteOrganization({ orgId: 'org' })).rejects.toBeInstanceOf(
            NetworkError
        );
        await expect(repo.deleteOrganization({ orgId: 'org' })).rejects.toBeInstanceOf(
            HttpError
        );
    });
});
