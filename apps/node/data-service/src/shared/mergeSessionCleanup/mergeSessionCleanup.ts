import type { MergeSessionRepo } from '@/core/ports/driven/repos';
import type { TmpFileStorageTool } from '@/core/ports/driven/tools';

export type MergeSessionCleanupOptions = {
    intervalMs: number;
    /** sessions older than this and missing in redis are removed from disk */
    maxAgeMs: number;
};

/**
 * starts a periodic cleanup that removes stale tmp directories whose redis sessions have already expired
 *
 * @param sessionRepo
 * @param tmpStorage
 * @param options
 * @returns stop function
 */
export function startMergeSessionCleanup(
    sessionRepo: MergeSessionRepo,
    tmpStorage: TmpFileStorageTool,
    options: MergeSessionCleanupOptions
): () => void {
    const tick = async () => {
        try {
            await runOnce(sessionRepo, tmpStorage, options.maxAgeMs);
        } catch (err) {
            // never crash the timer - log and move on
            console.error('merge session cleanup failed', err);
        }
    };

    const timer = setInterval(tick, options.intervalMs);
    // do not block process shutdown
    timer.unref?.();

    return () => clearInterval(timer);
}

export async function runOnce(
    sessionRepo: MergeSessionRepo,
    tmpStorage: TmpFileStorageTool,
    maxAgeMs: number
): Promise<void> {
    const [activeIds, onDisk] = await Promise.all([
        sessionRepo.listSessionIds(),
        tmpStorage.listSessions(),
    ]);

    const active = new Set(activeIds);
    const now = Date.now();

    for (const stat of onDisk) {
        if (active.has(stat.sessionId)) {
            continue;
        }

        // give recently-created dirs a grace period in case redis save hasn't completed yet
        if (now - stat.modifiedAt.getTime() < maxAgeMs) {
            continue;
        }

        await tmpStorage.deleteSession(stat.sessionId);
    }
}
