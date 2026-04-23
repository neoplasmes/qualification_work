import type { Readable } from 'node:stream';
import Busboy from '@fastify/busboy';

import type { MultipartFile, MultipartParserTool } from '@/core/ports/tools';

/**
 * multipart/form-data parser over @fastify/busboy - the fork of original busboy, which is deprecated
 *
 * @export
 * @class FastifyBusboyMultipartParserTool
 * @implements {MultipartParserTool}
 */
export class FastifyBusboyMultipartParserTool implements MultipartParserTool {
    async parse(
        requestStream: Readable,
        headers: Record<string, string | string[] | undefined>,
        /**
         * This is called when parsing of a particular file begins!!
         */
        onFileCallback: (file: MultipartFile) => Promise<void>
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const busboy = new Busboy({
                // Busboy requires content-type header to be passed
                headers: headers as unknown as { 'content-type': string } & Record<
                    string,
                    string
                >,
            });

            /**
             * actually it is a storage of asynchronuously parsing files. It has be there because when busboy finishes
             * his multipart data parsing, the processing of file data in other backend modules can be not finished.
             * Thus, we have to wait for the completion of all operations with file data before letting the /upload handler
             * to return HTTP response.
             *
             * @type {Promise<void>[]}
             */
            const filePromises: Promise<void>[] = [];
            let errorOccurred = false;

            busboy.on('file', (_fieldname, file, filename, _encoding, mimetype) => {
                if (errorOccurred) {
                    // resume method continues consuming the stream, but don't do anything with the data
                    file.resume();

                    return;
                }

                const promise = onFileCallback({
                    filename,
                    mimetype,
                    fileStream: file,
                }).catch(err => {
                    errorOccurred = true;

                    reject(err);
                });

                filePromises.push(promise);
            });

            busboy.on('error', (err: Error) => {
                errorOccurred = true;

                reject(err);
            });

            busboy.on('finish', () => {
                if (errorOccurred) {
                    return;
                }

                Promise.all(filePromises)
                    .then(() => resolve())
                    .catch(reject);
            });

            requestStream.pipe(busboy);
        });
    }
}
