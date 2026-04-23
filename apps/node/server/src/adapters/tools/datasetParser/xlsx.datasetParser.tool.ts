import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';

import type { DatasetParserTool } from '@/core/ports/tools';

export class XlsxDatasetParserTool implements DatasetParserTool {
    parseFileDataToJSObjectsStream(fileStream: Readable): Readable {
        return Readable.from(this.iterateRows(fileStream), { objectMode: true });
    }

    /**
     * iterator is more preferrabale for exceljs
     *
     * @private
     * @async
     * @param {Readable} fileStream
     * @returns {AsyncGenerator<Record<string, unknown>, void, unknown>}
     */
    private async *iterateRows(
        fileStream: Readable
    ): AsyncGenerator<Record<string, unknown>, void, unknown> {
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(fileStream, {
            worksheets: 'emit',
            sharedStrings: 'cache',
        });

        let headers: string[] = [];

        for await (const worksheetReader of workbookReader) {
            for await (const row of worksheetReader) {
                const values = row.values as unknown[];

                if (!values || values.length === 0) {
                    continue;
                }

                if (headers.length === 0) {
                    for (let i = 1; i < values.length; i++) {
                        headers.push(String(values[i] ?? `Column_${i}`).trim());
                    }

                    continue;
                }

                const rowObj: Record<string, unknown> = {};
                for (let i = 0; i < headers.length; i++) {
                    const val = values[i + 1];
                    if (val && typeof val === 'object' && 'result' in val) {
                        rowObj[headers[i]] = val.result;
                    } else {
                        rowObj[headers[i]] = val;
                    }
                }

                yield rowObj;
            }

            break;
        }
    }
}
