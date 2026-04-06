import { describe, expect, it } from 'vitest';

import { DefaultDatasetParserFactoryService } from './default.datasetParserFactory.service';

describe('DefaultDatasetParserFactoryService', () => {
    it('resolves csv parser by mimetype', () => {
        const resolved = DefaultDatasetParserFactoryService.resolveParser(
            'text/csv',
            'report.bin'
        );

        expect(resolved?.sourceType).toBe('csv');
        expect(resolved?.parser.constructor.name).toBe('CsvDatasetParserService');
    });

    it('resolves xlsx parser by file extension', () => {
        const resolved = DefaultDatasetParserFactoryService.resolveParser(
            'application/octet-stream',
            'report.XLSX'
        );

        expect(resolved?.sourceType).toBe('xlsx');
        expect(resolved?.parser.constructor.name).toBe('XlsxDatasetParserService');
    });

    it('returns null for unsupported files', () => {
        const resolved = DefaultDatasetParserFactoryService.resolveParser(
            'application/json',
            'report.json'
        );

        expect(resolved).toBeNull();
    });
});
