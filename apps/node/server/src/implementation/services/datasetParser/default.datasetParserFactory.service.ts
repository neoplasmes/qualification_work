import type { ResolveDatasetParser, ResolvedDatasetParser } from '@/core/ports/services';

import { CsvDatasetParserService } from './csv.datasetParser.service';
import { XlsxDatasetParserService } from './xlsx.datasetParser.service';

export class DefaultDatasetParserFactoryService {
    private static readonly csvParser = new CsvDatasetParserService();

    private static readonly xlsxParser = new XlsxDatasetParserService();

    static readonly resolveParser: ResolveDatasetParser = (
        mimetype: string,
        filename: string
    ): ResolvedDatasetParser | null => {
        const lowerName = filename.toLowerCase();

        if (mimetype === 'text/csv' || lowerName.endsWith('.csv')) {
            return {
                parser: DefaultDatasetParserFactoryService.csvParser,
                sourceType: 'csv',
            };
        }

        if (
            mimetype ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            lowerName.endsWith('.xlsx')
        ) {
            return {
                parser: DefaultDatasetParserFactoryService.xlsxParser,
                sourceType: 'xlsx',
            };
        }

        return null;
    };
}
