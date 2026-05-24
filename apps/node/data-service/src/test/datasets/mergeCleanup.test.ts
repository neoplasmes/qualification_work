import { readdir, utimes } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { RedisMergeSessionRepo } from '@/adapters/driven/repos';
import { DiskTmpFileStorageTool } from '@/adapters/driven/tools';
import { runMergeCleanupOnce } from '@/shared/mergeSessionCleanup';

import { getTestRedis, startServer, stopServer, truncate } from '../setup';

beforeAll(startServer);
afterAll(stopServer);
afterEach(truncate);

describe('merge session cleanup', () => {
    it('removes stale tmp dirs not referenced by redis', async () => {
        const tmpRoot = process.env.MERGE_TMP_DIR ?? '/tmp/datasets-test';
        const sessionId = `stale-${Date.now()}`;

        const storage = new DiskTmpFileStorageTool(tmpRoot);
        await storage.ensureSessionDir(sessionId);

        // back-date the dir to look stale
        const old = new Date(Date.now() - 60 * 60 * 1000);
        await utimes(path.join(tmpRoot, sessionId), old, old);

        const repo = new RedisMergeSessionRepo(getTestRedis());

        await runMergeCleanupOnce(repo, storage, 1000);

        const entries = await readdir(tmpRoot).catch(() => []);
        expect(entries).not.toContain(sessionId);
    });

    it('keeps recent dirs even if not in redis (grace period)', async () => {
        const tmpRoot = process.env.MERGE_TMP_DIR ?? '/tmp/datasets-test';
        const sessionId = `fresh-${Date.now()}`;

        const storage = new DiskTmpFileStorageTool(tmpRoot);
        await storage.ensureSessionDir(sessionId);

        const repo = new RedisMergeSessionRepo(getTestRedis());

        await runMergeCleanupOnce(repo, storage, 60 * 60 * 1000);

        const entries = await readdir(tmpRoot);
        expect(entries).toContain(sessionId);

        await storage.deleteSession(sessionId);
    });
});
