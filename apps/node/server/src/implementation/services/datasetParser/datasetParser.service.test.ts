import { createReadStream } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import type { DatasetParserService } from '@/core/ports';

import { CsvDatasetParserService } from './csv.datasetParser.service';
import { XlsxDatasetParserService } from './xlsx.datasetParser.service';

async function collectRows(filePath: string, parser: DatasetParserService) {
    const fileStream = createReadStream(filePath);
    const rowStream = parser.parseFileDataToJSObjectsStream(fileStream);
    const rows: Record<string, unknown>[] = [];

    for await (const row of rowStream as AsyncIterable<Record<string, unknown>>) {
        rows.push(row);
    }

    return rows;
}

describe('CsvDatasetParserService', () => {
    const parser = new CsvDatasetParserService();
    const assetsDir = path.resolve(import.meta.dirname, '../../../tests/assets');

    it('parses a larger csv dataset into row objects', async () => {
        const rows = await collectRows(path.join(assetsDir, 'datasetBasic.csv'), parser);

        expect(rows).toHaveLength(22);
        expect(rows[0]).toEqual({
            id: '1',
            name: 'Alice Johnson',
            age: '30',
            active: 'true',
            city: 'Paris',
            country: 'France',
            score: '91',
            signupDate: '2024-01-10',
        });
        expect(rows[21]).toEqual({
            id: '22',
            name: 'Victor Cox',
            age: '39',
            active: 'true',
            city: 'Riga',
            country: 'Latvia',
            score: '83',
            signupDate: '2024-01-31',
        });
    });

    it('trims spaced values and skips empty lines', async () => {
        const rows = await collectRows(
            path.join(assetsDir, 'datasetWithWhitespace.csv'),
            parser
        );

        expect(rows).toHaveLength(22);
        expect(rows[0]).toEqual({
            id: '101',
            name: 'Alice Johnson',
            department: 'Sales',
            city: 'Paris',
            active: 'true',
            score: '91',
            budget: '120000',
            reviewDate: '2024-02-01',
        });
        expect(rows[22 - 1]).toEqual({
            id: '122',
            name: 'Victor Cox',
            department: 'Product',
            city: 'Riga',
            active: 'true',
            score: '83',
            budget: '147000',
            reviewDate: '2024-02-22',
        });
    });
});

describe('XlsxDatasetParserService', () => {
    const parser = new XlsxDatasetParserService();
    const assetsDir = path.resolve(import.meta.dirname, '../../../tests/assets');

    it('parses a larger xlsx dataset into row objects', async () => {
        const rows = await collectRows(path.join(assetsDir, 'datasetBasic.xlsx'), parser);

        expect(rows).toHaveLength(22);
        expect(rows[0]).toEqual({
            id: 1,
            name: 'Alice Johnson',
            age: 30,
            active: true,
            city: 'Paris',
            country: 'France',
            score: 91,
            signupDate: '2024-01-10',
        });
        expect(rows[21]).toEqual({
            id: 22,
            name: 'Victor Cox',
            age: 39,
            active: true,
            city: 'Riga',
            country: 'Latvia',
            score: 83,
            signupDate: '2024-01-31',
        });
    });

    it('reads only the first worksheet for upload behavior', async () => {
        const rows = await collectRows(
            path.join(assetsDir, 'datasetMultiSheet.xlsx'),
            parser
        );

        expect(rows).toHaveLength(22);
        expect(rows[0]).toEqual({
            id: 201,
            name: 'North Team',
            region: 'EMEA',
            city: 'Paris',
            active: true,
            score: 71,
            budget: 210000,
            reviewDate: '2024-03-01',
        });
        expect(rows[21]).toEqual({
            id: 222,
            name: 'Prime Team',
            region: 'LATAM',
            city: 'Bogota',
            active: true,
            score: 92,
            budget: 315000,
            reviewDate: '2024-03-22',
        });
    });
});
