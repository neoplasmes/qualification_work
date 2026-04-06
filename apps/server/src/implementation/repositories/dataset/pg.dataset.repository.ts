import type { Pool } from 'pg';

import type { CreateDatasetPayload, DatasetRepository } from '@/core/ports/repositories';

export class PgDatasetRepository implements DatasetRepository {
    constructor(private readonly pool: Pool) {}

    private static readonly ROW_BATCH_SIZE = 500;

    async createCompleteDataset(
        data: CreateDatasetPayload,
        /**
         * this callback has to invoke the passed insertRow function until the end of the data
         */
        forwardRowsWithIndex: (
            insertRow: (index: number, rowData: Record<string, unknown>) => Promise<void>
        ) => Promise<void>
    ): Promise<{ id: string }> {
        if (data.columns.length === 0) {
            throw new Error('eto chto');
        }

        /**
         * It is necessary to allocate a new connection so that all transaction commands are linked together
         */
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // ------------------------- allocating dataset ---------------------------
            const datasetRes = await client.query<{ id: string }>(
                `INSERT INTO data.datasets (org_id, name, source_type) VALUES ($1, $2, $3) RETURNING id`,
                [data.orgId, data.name, data.sourceType]
            );

            const datasetId = datasetRes.rows[0].id;

            // ------------------------- allocating columns ---------------------------
            const columnValues: unknown[] = [];
            const columnPlaceholders: string[] = [];
            let columnParamIndex = 1;

            for (const column of data.columns) {
                columnPlaceholders.push(
                    `($${columnParamIndex++}, $${columnParamIndex++}, $${columnParamIndex++}, $${columnParamIndex++}, $${columnParamIndex++})`
                );
                columnValues.push(
                    datasetId,
                    column.key,
                    column.displayName,
                    column.dataType,
                    column.orderIndex
                );
            }

            await client.query(
                `INSERT INTO data.dataset_columns (dataset_id, key, display_name, data_type, order_index)
                VALUES ${columnPlaceholders.join(', ')}`,
                columnValues
            );

            // ------------------------- allocating rows ---------------------------
            let rowsBatch: Array<{ index: number; data: Record<string, unknown> }> = [];

            const sendBatch = async () => {
                if (rowsBatch.length === 0) {
                    return;
                }

                const rowValues: unknown[] = [];
                const rowPlaceholders: string[] = [];
                let rowParamIndex = 1;

                for (const row of rowsBatch) {
                    rowPlaceholders.push(
                        `($${rowParamIndex++}, $${rowParamIndex++}, $${rowParamIndex++})`
                    );
                    rowValues.push(datasetId, row.index, row.data);
                }

                // TODO: migrate to copy from for better performance
                await client.query(
                    `
                    INSERT INTO data.dataset_rows (dataset_id, row_index, data)
                    VALUES ${rowPlaceholders.join(', ')}
                `,
                    rowValues
                );

                rowsBatch.length = 0;
            };

            const insertRow = async (
                rowIndex: number,
                rowData: Record<string, unknown>
            ) => {
                rowsBatch.push({ index: rowIndex, data: rowData });

                if (rowsBatch.length >= PgDatasetRepository.ROW_BATCH_SIZE) {
                    await sendBatch();
                }
            };

            await forwardRowsWithIndex(insertRow);

            // send rows till the end, because our insertRow function ignores raw inserting until tht ROW_BATCH_SIZE is reached
            await sendBatch();

            await client.query('COMMIT');

            return { id: datasetId };
        } catch (err) {
            await client.query('ROLLBACK');

            throw err;
        } finally {
            client.release();
        }
    }
}
