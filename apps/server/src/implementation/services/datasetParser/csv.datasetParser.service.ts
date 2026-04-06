import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';

import type { DatasetParserService } from '@/core/ports/services';

export class CsvDatasetParserService implements DatasetParserService {
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
