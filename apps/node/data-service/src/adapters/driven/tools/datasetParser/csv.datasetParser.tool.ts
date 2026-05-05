import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';

import type { DatasetParserTool } from '@/core/ports/driven/tools';

export class CsvDatasetParserTool implements DatasetParserTool {
    parseFileDataToJSObjectsStream(fileStream: Readable): Readable {
        return fileStream.pipe(
            parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
        );
    }
}
