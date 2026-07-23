import { CacheProvider } from '@/env/cache/context';
import { createDependencies } from '@/main/dependencies';
import { datasetFixture } from '@/test/cacheFixtures';
import { dependenciesContext } from '@/ui/di/dependencies';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

export const previewFixture = {
    sessionId: 'session-1',
    expiresInMs: 1800000,
    conflicts: [],
    statistics: {
        totalFiles: 1,
        totalIncomingRows: 2,
        totalNewRows: 2,
        totalDuplicateRows: 0,
        existingRowCount: 2,
        copiedRows: 0,
        newColumns: [],
        commonColumns: ['id'],
    },
};
export const commitFixture = {
    datasetId: 'returned-id',
    insertedRows: 2,
    updatedRows: 0,
    skippedDuplicates: 0,
    copiedRows: 0,
};
export const metadataFixture = { dataset: datasetFixture, columns: [], totalRows: 2 };

export function createUploadHarness() {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async (url, init) => {
            const path = String(url);
            if (path.includes('/metadata')) {
                return Response.json({
                    ...metadataFixture,
                    dataset: {
                        ...metadataFixture.dataset,
                        id: decodeURIComponent(path.split('/').at(-2)!),
                    },
                });
            }
            if (path.includes('/preview')) {
                return Response.json(previewFixture);
            }
            if (path.includes('/commit')) {
                return Response.json(commitFixture);
            }
            if (init?.method === 'DELETE') {
                return new Response(null, { status: 204 });
            }
            if (init?.method === 'POST') {
                return Response.json({ id: 'uploaded-id' });
            }

            return Response.json([metadataFixture]);
        });
    vi.stubGlobal('fetch', fetch);
    const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <dependenciesContext.Provider value={runtime.dependencies}>
                <CacheProvider runtime={runtime.cache}>{children}</CacheProvider>
            </dependenciesContext.Provider>
        );
    }

    return { runtime, fetch, Wrapper };
}
