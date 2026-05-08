import type { Readable } from 'node:stream';
import Busboy from '@fastify/busboy';

export type MultipartFile = {
    filename: string;
    mimetype: string;
    fileStream: Readable;
};

/**
 * multipart/form-data stream parser. Used only locally in the adapters layer.
 * thus, it can use raw request and request headers
 *
 * @export
 * @interface MultipartParserTool
 */
export interface MultipartParserTool {
    /**
     * Parses a multipart request stream and calls 'onFile' for each file that was found.
     *
     * @param requestStream The incoming byte stream of the request body
     * @param headers The HTTP request headers containing content-type
     * @param onFileCallback Callback invoked when a chunk with filename and mimetype is found.
     * It means that the content of a new file has started in the stream.
     * @returns
     */
    parse(
        requestStream: Readable,
        headers: Record<string, string | string[] | undefined>,
        onFileCallback: (file: MultipartFile) => Promise<void>
    ): Promise<void>;
}

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
