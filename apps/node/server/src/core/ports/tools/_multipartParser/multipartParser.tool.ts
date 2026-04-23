import type { Readable } from 'node:stream';

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
