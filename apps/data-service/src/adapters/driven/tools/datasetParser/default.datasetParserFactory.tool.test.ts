import { describe, expect, it } from 'vitest';

import { DefaultDatasetParserFactoryTool } from './default.datasetParserFactory.tool';

describe('DefaultDatasetParserFactoryTool', () => {
    it('resolves csv parser by mimetype', () => {
        const resolved = DefaultDatasetParserFactoryTool.resolveParser(
            'text/csv',
            'report.bin'
        );

        expect(resolved?.sourceType).toBe('csv');
        expect(resolved?.parser.constructor.name).toBe('CsvDatasetParserTool');
    });

    it('resolves xlsx parser by file extension', () => {
        const resolved = DefaultDatasetParserFactoryTool.resolveParser(
            'application/octet-stream',
            'report.XLSX'
        );

        expect(resolved?.sourceType).toBe('xlsx');
        expect(resolved?.parser.constructor.name).toBe('XlsxDatasetParserTool');
    });

    it('returns null for unsupported files', () => {
        const resolved = DefaultDatasetParserFactoryTool.resolveParser(
            'application/json',
            'report.json'
        );

        expect(resolved).toBeNull();
    });
});
