import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { parseWithZod, ValidationError } from '@qualification-work/microservice-utils';
import { getInternalIdentity } from '@qualification-work/microservice-utils/internalAuth';
import { mergeModes } from '@qualification-work/types';

import type { PreviewMergeCommand } from '@/core/commands';
import type { SavedTmpFile, TmpFileStorageTool } from '@/core/ports/driven/tools';

import type { MultipartParserTool } from '@/adapters/driven/tools/_multipartParser';

import type { RequestHandlerType } from '@/shared/appState';

const previewSchema = z.object({
    orgId: z.uuid(),
    datasetId: z.uuid().nullable(),
    name: z.string().min(1).max(255).nullable(),
    mode: z.enum(mergeModes).default('merge'),
    createNew: z.boolean().default(false),
    mergeKeys: z.array(z.string().min(1)),
});

export type MergePreviewHandlerConfig = {
    maxFileBytes: number;
};

/**
 * POST /datasets/merge/preview
 * query: orgId, datasetId?, name?, mode?, createNew?, mergeKeys (comma-separated)
 * body: multipart with N files
 */
export function createMergePreviewHandler(
    handler: PreviewMergeCommand,
    multipartParser: MultipartParserTool,
    tmpStorage: TmpFileStorageTool,
    config: MergePreviewHandlerConfig
): RequestHandlerType {
    return async ({ request, response }) => {
        const sessionId = randomUUID();
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');
        const identity = getInternalIdentity(request);

        const datasetIdRaw =
            typeof request.query.datasetId === 'string' &&
            request.query.datasetId.length > 0
                ? request.query.datasetId
                : null;
        const nameRaw =
            typeof request.query.name === 'string' && request.query.name.length > 0
                ? request.query.name
                : null;
        const mergeKeysRaw =
            typeof request.query.mergeKeys === 'string' &&
            request.query.mergeKeys.length > 0
                ? request.query.mergeKeys
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                : [];
        const modeRaw =
            typeof request.query.mode === 'string' && request.query.mode.length > 0
                ? request.query.mode
                : 'merge';
        const createNewRaw =
            typeof request.query.createNew === 'string'
                ? request.query.createNew === 'true'
                : false;

        const input = parseWithZod(previewSchema, {
            orgId: orgIdFromRequest,
            datasetId: datasetIdRaw,
            name: nameRaw,
            mode: modeRaw,
            createNew: createNewRaw,
            mergeKeys: mergeKeysRaw,
        });

        await tmpStorage.ensureSessionDir(sessionId);

        const saved: SavedTmpFile[] = [];
        let fileIndex = 0;

        try {
            await multipartParser.parse(
                request,
                request.headers as Record<string, string | string[] | undefined>,
                async filePart => {
                    const idx = fileIndex++;
                    const savedFile = await tmpStorage.saveFile(
                        sessionId,
                        idx,
                        filePart.filename,
                        filePart.fileStream,
                        config.maxFileBytes
                    );
                    saved.push(savedFile);
                }
            );

            if (saved.length === 0) {
                throw new ValidationError([], 'no files were uploaded');
            }

            const result = await handler.execute({
                sessionId,
                orgId: input.orgId,
                userId: identity.userId,
                datasetId: input.datasetId,
                name: input.name,
                mode: input.mode,
                createNew: input.createNew,
                mergeKeys: input.mergeKeys,
                savedFiles: saved,
            });

            response.status(200).json(result);
        } catch (err) {
            await tmpStorage.deleteSession(sessionId).catch(() => undefined);

            throw err;
        }
    };
}
