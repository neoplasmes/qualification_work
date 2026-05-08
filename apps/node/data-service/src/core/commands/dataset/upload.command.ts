import type { Readable } from 'node:stream';

import type { ColumnDataType } from '@/core/domain';
import { AppError, ValidationError } from '@/core/errors';
import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { ResolveDatasetParser } from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import type { MultipartFile } from '@/adapters/driven/tools/_multipartParser';

import { inferDatasetTypes } from './helpers';

type DatasetRow = Record<string, unknown>;

const PREVIEW_ROWS_LIMIT = 10;

export class UploadDatasetCommand implements Executable<
    [string, MultipartFile],
    Promise<{ id: string }>
> {
    constructor(
        private readonly resolveParser: ResolveDatasetParser,
        private readonly datasetRepo: DatasetRepo
    ) {}

    async execute(orgId: string, file: MultipartFile) {
        const resolvedParser = this.resolveParser(file.mimetype, file.filename);

        if (!resolvedParser) {
            throw new ValidationError([], 'Unsupported file type');
        }

        const datasetName = this.getDatasetName(file.filename);
        const { parser, sourceType } = resolvedParser;

        // file stream -> js objects stream
        const rowStream = parser.parseFileDataToJSObjectsStream(file.fileStream);
        const previewRows = await this.readPreviewRows(rowStream, PREVIEW_ROWS_LIMIT);

        if (previewRows.length === 0) {
            throw new ValidationError([], 'Dataset is empty');
        }

        const columns = inferDatasetTypes(previewRows).map(
            (column: { key: string; dataType: ColumnDataType }, index: number) => ({
                key: column.key,
                displayName: column.key,
                dataType: column.dataType,
                orderIndex: index,
            })
        );

        if (columns.length <= 0) {
            throw new ValidationError([], 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        }

        // js objects stream -> database insertion stream, completion of which returns the result
        const result = await this.datasetRepo.createCompleteDataset(
            {
                orgId,
                name: datasetName,
                sourceType,
                columns: columns,
            },
            insertRow => this.forwardRowsWithIndex(insertRow, previewRows, rowStream)
        );

        return { id: result.id };
    }

    /**
     * okay
     *
     * @private
     * @param {string} filename
     * @returns {string}
     */
    private getDatasetName(filename: string): string {
        return filename.replace(/\.[^/.]+$/, '');
    }

    /**
     * reads the amount of rows on the basis of which the columns types will be determined
     * Preview rows are read directly from the stream buffer so the same readable
     * instance can still be consumed after.
     *
     * GENERATORS-based approach doesn't work because 'break' in the cycle just kills the generator???
     *
     * @private
     * @async
     * @param {Readable} rowStream
     * @param {number} limit
     * @returns {Promise<DatasetRow[]>}
     */
    private async readPreviewRows(
        rowStream: Readable,
        limit: number
    ): Promise<DatasetRow[]> {
        const previewRows: DatasetRow[] = [];

        while (previewRows.length < limit) {
            if (rowStream.destroyed) {
                throw new AppError(
                    'FATAL IMPOSSIBLE ERROR in src/core/commands/uploadDataset/handler.ts'
                );
            }

            const row = rowStream.read() as DatasetRow | null;

            if (row !== null) {
                previewRows.push(row);

                continue;
            }

            if (rowStream.readableEnded) {
                break;
            }

            const outcome = await this.waitForReadableOrEnd(rowStream);

            if (outcome === 'end') {
                break;
            }
        }

        return previewRows;
    }

    /**
     * unbelievable function, that passes the row stream to other entity, that will insert these rows
     *
     * @private
     * @async
     * @param {(index: number, rowData: DatasetRow) => Promise<void>} insertRow
     * @param {DatasetRow[]} previewRows
     * @param {Readable} rowStream
     * @returns {Promise<void>}
     */
    private async forwardRowsWithIndex(
        insertRow: (index: number, rowData: DatasetRow) => Promise<void>,
        previewRows: DatasetRow[],
        rowStream: Readable
    ): Promise<void> {
        let rowIndex = 0;

        for (const row of previewRows) {
            await insertRow(rowIndex++, row);
        }

        for await (const row of rowStream) {
            await insertRow(rowIndex++, row as DatasetRow);
        }
    }

    /**
     * Description placeholder
     *
     * @private
     * @param {Readable} rowStream
     * @returns {Promise<'readable' | 'end'>}
     */
    private waitForReadableOrEnd(rowStream: Readable): Promise<'readable' | 'end'> {
        return new Promise((resolve, reject) => {
            const onReadable = () => {
                cleanup();
                resolve('readable');
            };

            const onEnd = () => {
                cleanup();
                resolve('end');
            };

            const onError = (error: Error) => {
                cleanup();
                reject(error);
            };

            const cleanup = () => {
                rowStream.off('readable', onReadable);
                rowStream.off('end', onEnd);
                rowStream.off('error', onError);
            };

            // this is actually waiting for the next ready chunk of data.
            rowStream.once('readable', onReadable);
            rowStream.once('end', onEnd);
            rowStream.once('error', onError);
        });
    }
}

export type UploadDatasetCommandIO = ExecutableIO<UploadDatasetCommand>;
