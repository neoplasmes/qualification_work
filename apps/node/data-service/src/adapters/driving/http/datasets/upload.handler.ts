import { z } from 'zod';

import type { UploadDatasetCommand } from '@/core/commands';
import { ValidationError } from '@/core/errors';

import type { MultipartParserTool } from '@/adapters/driven/tools/_multipartParser';

import type { RequestHandlerType } from '@/shared/appState';
import { parseWithZod } from '@/shared/parseWithZod';

const uploadDatasetSchema = z.object({
    orgId: z.uuid(),
});

/**
 * handlles POST /datasets request, parses multipart form data and passes it to the handler
 *
 * @header x-org-id header can be specified to provide uuid of organisation, for which dataset has to be created
 *
 * @export
 * @param {UploadDatasetCommand} handler
 * @returns {RequestHandlerType}
 */
export function createUploadDatasetHandler(
    handler: UploadDatasetCommand,
    multipartParser: MultipartParserTool
): RequestHandlerType {
    return async ({ request, response }) => {
        const orgIdFromRequest = request.query.orgId ?? request.getHeader('x-org-id');

        const input = parseWithZod(() =>
            uploadDatasetSchema.parse({
                orgId: orgIdFromRequest,
            })
        );

        // TODO: handle the uploading of more than one file.
        let result: Awaited<ReturnType<UploadDatasetCommand['execute']>> | undefined;
        let uploadedFilesCount = 0;

        await multipartParser.parse(
            request,
            request.headers as Record<string, string | string[] | undefined>,
            async filePart => {
                uploadedFilesCount += 1;

                if (uploadedFilesCount > 1) {
                    //* At this moment we just ignore the situation when more than one file is uploaded,
                    //* however, there should be an error handling, but now idk what will be if the error will be thrown after
                    //* the uploading of the first file.
                    filePart.fileStream.resume();

                    // throw new ValidationError(
                    //     [],
                    //     'Only one file is supported per upload'
                    // );
                }

                result = await handler.execute(input.orgId, filePart);
            }
        );

        if (!result) {
            throw new ValidationError([], 'No file was uploaded');
        }

        response.status(201).json(result);
    };
}
