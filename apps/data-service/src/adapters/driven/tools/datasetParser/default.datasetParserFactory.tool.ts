import type {
    ResolveDatasetParser,
    ResolvedDatasetParser,
} from '@/core/ports/driven/tools';

import { CsvDatasetParserTool } from './csv.datasetParser.tool';
import { XlsxDatasetParserTool } from './xlsx.datasetParser.tool';

export class DefaultDatasetParserFactoryTool {
    private static readonly csvParser = new CsvDatasetParserTool();

    private static readonly xlsxParser = new XlsxDatasetParserTool();

    static readonly resolveParser: ResolveDatasetParser = (
        mimetype: string,
        filename: string
    ): ResolvedDatasetParser | null => {
        const lowerName = filename.toLowerCase();

        if (mimetype === 'text/csv' || lowerName.endsWith('.csv')) {
            return {
                parser: DefaultDatasetParserFactoryTool.csvParser,
                sourceType: 'csv',
            };
        }

        if (
            mimetype ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            lowerName.endsWith('.xlsx')
        ) {
            return {
                parser: DefaultDatasetParserFactoryTool.xlsxParser,
                sourceType: 'xlsx',
            };
        }

        return null;
    };
}
