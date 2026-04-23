import type { Pool } from 'pg';

import type { Dataset, DatasetColumn, DatasetRow } from '@/core/domain';
import type {
    CreateDatasetPayload,
    DatasetMetadata,
    DatasetRepository,
    DatasetRowsPage,
    GetDatasetRowsPayload,
} from '@/core/ports/repositories';

// TODO: something should be done with this.
const datasetColumnMap: Partial<Record<keyof Dataset, string>> = {
    orgId: 'org_id AS "orgId"',
    sourceType: 'source_type AS "sourceType"',
    createdAt: 'created_at AS "createdAt"',
    updatedAt: 'updated_at AS "updatedAt"',
};

const datasetMetadataColumnMap: Partial<Record<keyof DatasetColumn, string>> = {
    datasetId: 'dataset_id AS "datasetId"',
    displayName: 'display_name AS "displayName"',
    dataType: 'data_type AS "dataType"',
    orderIndex: 'order_index AS "orderIndex"',
};

const datasetRowColumnMap: Partial<Record<keyof DatasetRow, string>> = {
    datasetId: 'dataset_id AS "datasetId"',
    rowIndex: 'row_index AS "rowIndex"',
};

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
                    `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
                    VALUES ${rowPlaceholders.join(', ')}`,
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

    /**
     * Description placeholder
     *
     * @async
     * @param {string} datasetId
     * @returns {Promise<DatasetMetadata | null>}
     */
    async getDatasetMetadataByDatasetId(
        datasetId: string
    ): Promise<DatasetMetadata | null> {
        const [dataset] = await this.pool
            .query<Dataset>(
                `SELECT
                    id,
                    ${datasetColumnMap.orgId},
                    name,
                    ${datasetColumnMap.sourceType},
                    ${datasetColumnMap.createdAt},
                    ${datasetColumnMap.updatedAt}
                FROM data.datasets
                WHERE id = $1`,
                [datasetId]
            )
            .then(result => result.rows);

        if (!dataset) {
            return null;
        }

        const columns = await this.pool
            .query<DatasetColumn>(
                `SELECT
                    id,
                    ${datasetMetadataColumnMap.datasetId},
                    key,
                    ${datasetMetadataColumnMap.displayName},
                    ${datasetMetadataColumnMap.dataType},
                    ${datasetMetadataColumnMap.orderIndex}
                FROM data.dataset_columns
                WHERE dataset_id = $1
                ORDER BY order_index`,
                [datasetId]
            )
            .then(result => result.rows);

        const [{ totalRows }] = await this.pool
            .query<{ totalRows: string }>(
                `SELECT COUNT(*)::text AS "totalRows"
                FROM data.dataset_rows
                WHERE dataset_id = $1`,
                [datasetId]
            )
            .then(result => result.rows);

        return {
            dataset,
            columns,
            totalRows: Number(totalRows),
        };
    }

    /**
     * Description placeholder
     *
     * @async
     * @param {string} orgId
     * @returns {Promise<DatasetMetadata[]>}
     */
    async getDatasetsMetadataByOrgId(orgId: string): Promise<DatasetMetadata[]> {
        // TODO: sync 'order by' with front
        const datasets = await this.pool
            .query<Dataset>(
                `SELECT
                    id,
                    ${datasetColumnMap.orgId},
                    name,
                    ${datasetColumnMap.sourceType},
                    ${datasetColumnMap.createdAt},
                    ${datasetColumnMap.updatedAt}
                FROM data.datasets
                WHERE org_id = $1
                ORDER BY created_at DESC, name ASC`,
                [orgId]
            )
            .then(result => result.rows);

        if (datasets.length === 0) {
            return [];
        }

        const datasetIds = datasets.map(dataset => dataset.id);

        // TODO: optimization??
        const columns = await this.pool
            .query<DatasetColumn>(
                `SELECT
                   id,
                   ${datasetMetadataColumnMap.datasetId},
                   key,
                   ${datasetMetadataColumnMap.displayName},
                   ${datasetMetadataColumnMap.dataType},
                   ${datasetMetadataColumnMap.orderIndex}
                FROM data.dataset_columns
                WHERE dataset_id = ANY($1::uuid[])
                ORDER BY dataset_id, order_index`,
                [datasetIds]
            )
            .then(result => result.rows);

        const columnsByDatasetId = new Map<string, DatasetColumn[]>();
        for (const column of columns) {
            if (!columnsByDatasetId.has(column.datasetId)) {
                columnsByDatasetId.set(column.datasetId, []);
            }

            columnsByDatasetId.get(column.datasetId)!.push(column);
        }

        const rowsStats = await this.pool
            .query<{ datasetId: string; totalRows: string }>(
                `SELECT dataset_id AS "datasetId", COUNT(*)::text AS "totalRows"
                FROM data.dataset_rows
                WHERE dataset_id = ANY($1::uuid[])
                GROUP BY dataset_id`,
                [datasetIds]
            )
            .then(result => result.rows);

        const totalRowsByDatasetId = new Map<string, number>();
        for (const rowStat of rowsStats) {
            totalRowsByDatasetId.set(rowStat.datasetId, Number(rowStat.totalRows));
        }

        return datasets.map(dataset => ({
            dataset,
            columns: columnsByDatasetId.get(dataset.id) ?? [],
            totalRows: totalRowsByDatasetId.get(dataset.id) ?? 0,
        }));
    }

    /**
     * Description placeholder
     *
     * @async
     * @param {GetDatasetRowsPayload} data
     * @returns {Promise<DatasetRowsPage | null>}
     */
    async getDatasetRowsPageById(
        data: GetDatasetRowsPayload
    ): Promise<DatasetRowsPage | null> {
        const [{ exists }] = await this.pool
            .query<{
                exists: number;
            }>(
                'SELECT EXISTS(SELECT 1 FROM data.datasets WHERE id = $1)::int AS exists',
                [data.datasetId]
            )
            .then(result => result.rows);

        if (exists !== 1) {
            return null;
        }

        const rows = await this.pool
            .query<DatasetRow>(
                `SELECT
                    id,
                    ${datasetRowColumnMap.datasetId},
                    ${datasetRowColumnMap.rowIndex},
                    data
                FROM data.dataset_rows
                WHERE dataset_id = $1
                ORDER BY row_index
                OFFSET $2
                LIMIT $3`,
                [data.datasetId, data.offset, data.limit]
            )
            .then(result => result.rows);

        const [{ totalRows }] = await this.pool
            .query<{ totalRows: string }>(
                `SELECT COUNT(*)::text AS "totalRows"
                FROM data.dataset_rows
                WHERE dataset_id = $1`,
                [data.datasetId]
            )
            .then(result => result.rows);

        return {
            rows,
            totalRows: Number(totalRows),
            offset: data.offset,
            limit: data.limit,
        };
    }
}
