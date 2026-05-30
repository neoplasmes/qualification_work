import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';

import { ValidationError } from '@qualification-work/microservice-utils';

import type {
    SavedTmpFile,
    TmpFileStorageTool,
    TmpSessionStat,
} from '@/core/ports/driven/tools';

export class DiskTmpFileStorageTool implements TmpFileStorageTool {
    constructor(private readonly rootDir: string) {}

    private sessionDir(sessionId: string): string {
        return path.join(this.rootDir, sessionId);
    }

    async ensureSessionDir(sessionId: string): Promise<void> {
        await mkdir(this.sessionDir(sessionId), { recursive: true });
    }

    async saveFile(
        sessionId: string,
        fileIndex: number,
        originalName: string,
        input: Readable,
        maxBytes: number
    ): Promise<SavedTmpFile> {
        await this.ensureSessionDir(sessionId);

        const safeName = originalName.replace(/[^\w.-]/g, '_');
        const filePath = path.join(
            this.sessionDir(sessionId),
            `${fileIndex}-${safeName}`
        );
        const out = createWriteStream(filePath);

        let size = 0;
        let aborted = false;

        await new Promise<void>((resolve, reject) => {
            const onData = (chunk: Buffer) => {
                size += chunk.length;

                if (size > maxBytes) {
                    aborted = true;
                    input.removeListener('data', onData);
                    out.destroy();
                    input.resume();
                    reject(
                        new ValidationError([], `file "${originalName}" exceeds limit`)
                    );
                }
            };

            input.on('data', onData);
            input.on('error', reject);
            out.on('error', reject);
            out.on('finish', () => resolve());

            input.pipe(out);
        }).catch(async err => {
            await rm(filePath, { force: true });

            throw err;
        });

        if (aborted) {
            await rm(filePath, { force: true });

            throw new ValidationError([], `file "${originalName}" exceeds limit`);
        }

        return { fileIndex, originalName, path: filePath, sizeBytes: size };
    }

    openFile(filePath: string): Readable {
        return createReadStream(filePath);
    }

    async deleteSession(sessionId: string): Promise<void> {
        await rm(this.sessionDir(sessionId), { recursive: true, force: true });
    }

    async listSessions(): Promise<TmpSessionStat[]> {
        let entries: string[];
        try {
            entries = await readdir(this.rootDir);
        } catch {
            return [];
        }

        const result: TmpSessionStat[] = [];

        for (const name of entries) {
            const full = path.join(this.rootDir, name);
            try {
                const st = await stat(full);
                if (st.isDirectory()) {
                    result.push({ sessionId: name, modifiedAt: st.mtime });
                }
            } catch {
                // silently skip - entry may have been removed by another worker
            }
        }

        return result;
    }
}
