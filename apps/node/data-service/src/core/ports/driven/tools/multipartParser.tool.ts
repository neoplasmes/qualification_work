import type { Readable } from 'node:stream';

export type MultipartFile = {
    filename: string;
    mimetype: string;
    fileStream: Readable;
};
