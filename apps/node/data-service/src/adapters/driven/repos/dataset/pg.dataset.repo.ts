import type { Pool } from 'pg';

import type { Dataset, DatasetColumn, DatasetRow } from '@/core/domain';
import type {
    AppendRowsFn,
    CreateDatasetPayload,
    DatasetMetadata,
    DatasetRepo,
    DatasetRowsPage,
    DatasetUniquenessViolation,
    GetDatasetRowsPayload,
} from '@/core/ports/driven/repos';

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

export class PgDatasetRepo implements DatasetRepo {
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

                if (rowsBatch.length >= PgDatasetRepo.ROW_BATCH_SIZE) {
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

    async createEmptyDataset(data: CreateDatasetPayload): Promise<{ id: string }> {
        if (data.columns.length === 0) {
            throw new Error('createEmptyDataset requires at least one column');
        }

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const [{ id: datasetId }] = await client
                .query<{ id: string }>(
                    `INSERT INTO data.datasets (org_id, name, source_type)
                    VALUES ($1, $2, $3) RETURNING id`,
                    [data.orgId, data.name, data.sourceType]
                )
                .then(r => r.rows);

            const values: unknown[] = [];
            const placeholders: string[] = [];
            let i = 1;
            for (const c of data.columns) {
                placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
                values.push(datasetId, c.key, c.displayName, c.dataType, c.orderIndex);
            }

            await client.query(
                `INSERT INTO data.dataset_columns (dataset_id, key, display_name, data_type, order_index)
                VALUES ${placeholders.join(', ')}`,
                values
            );

            await client.query('COMMIT');

            return { id: datasetId };
        } catch (err) {
            await client.query('ROLLBACK');

            throw err;
        } finally {
            client.release();
        }
    }

    async deleteById(datasetId: string): Promise<void> {
        await this.pool.query('DELETE FROM data.datasets WHERE id = $1', [datasetId]);
    }

    async updateRowValues(
        datasetId: string,
        rowId: string,
        partialData: Record<string, unknown>
    ): Promise<DatasetRow | null> {
        // jsonb concat (`||`) does shallow merge, so existing keys outside partialData stay intact
        const [row] = await this.pool
            .query<DatasetRow>(
                `UPDATE data.dataset_rows
                SET data = data || $3::jsonb
                WHERE dataset_id = $1 AND id = $2
                RETURNING
                    id,
                    ${datasetRowColumnMap.datasetId},
                    ${datasetRowColumnMap.rowIndex},
                    data`,
                [datasetId, rowId, JSON.stringify(partialData)]
            )
            .then(result => result.rows);

        return row ?? null;
    }

    async insertRow(
        datasetId: string,
        data: Record<string, unknown>
    ): Promise<DatasetRow> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // lock by dataset to serialize concurrent inserts and avoid duplicate row_index
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [datasetId]);

            const [{ nextIndex }] = await client
                .query<{ nextIndex: number }>(
                    `SELECT COALESCE(MAX(row_index), -1) + 1 AS "nextIndex"
                    FROM data.dataset_rows
                    WHERE dataset_id = $1`,
                    [datasetId]
                )
                .then(result => result.rows);

            const [row] = await client
                .query<DatasetRow>(
                    `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
                    VALUES ($1, $2, $3::jsonb)
                    RETURNING
                        id,
                        ${datasetRowColumnMap.datasetId},
                        ${datasetRowColumnMap.rowIndex},
                        data`,
                    [datasetId, nextIndex, JSON.stringify(data)]
                )
                .then(result => result.rows);

            await client.query('COMMIT');

            return row;
        } catch (err) {
            await client.query('ROLLBACK');

            throw err;
        } finally {
            client.release();
        }
    }

    async addColumns(
        datasetId: string,
        columns: Array<Omit<DatasetColumn, 'id' | 'datasetId'>>
    ): Promise<void> {
        if (columns.length === 0) {
            return;
        }

        const values: unknown[] = [];
        const placeholders: string[] = [];
        let i = 1;

        for (const c of columns) {
            placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
            values.push(datasetId, c.key, c.displayName, c.dataType, c.orderIndex);
        }

        // ON CONFLICT keeps existing column intact - we only add missing ones
        await this.pool.query(
            `INSERT INTO data.dataset_columns (dataset_id, key, display_name, data_type, order_index)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (dataset_id, key) DO NOTHING`,
            values
        );
    }

    async findDuplicateByMergeKeys(
        datasetId: string,
        mergeKeys: string[]
    ): Promise<DatasetUniquenessViolation | null> {
        if (mergeKeys.length === 0) {
            return null;
        }

        // build jsonb_build_object(...) projection for grouping by tuple
        const groupArgs: string[] = [];
        const params: unknown[] = [datasetId];
        let i = 2;

        for (const key of mergeKeys) {
            groupArgs.push(`$${i++}::text, data->$${i++}`);
            params.push(key, key);
        }

        const [violation] = await this.pool
            .query<{ tuple: Record<string, unknown>; count: string }>(
                `SELECT jsonb_build_object(${groupArgs.join(', ')}) AS tuple,
                        COUNT(*)::text AS count
                FROM data.dataset_rows
                WHERE dataset_id = $1
                GROUP BY tuple
                HAVING COUNT(*) > 1
                LIMIT 1`,
                params
            )
            .then(result => result.rows);

        if (!violation) {
            return null;
        }

        return { keys: violation.tuple, count: Number(violation.count) };
    }

    async streamAllRows(
        datasetId: string,
        abortIfMoreThan: number,
        cb: (row: { rowId: string; data: Record<string, unknown> }) => void
    ): Promise<{ loaded: number; aborted: boolean }> {
        // simple OFFSET/LIMIT pager; good enough for the merge map. cursor would be nicer but adds a client dep
        const PAGE = 5000;
        let offset = 0;
        let loaded = 0;

        while (loaded <= abortIfMoreThan) {
            const rows = await this.pool
                .query<{ rowId: string; data: Record<string, unknown> }>(
                    `SELECT id AS "rowId", data
                    FROM data.dataset_rows
                    WHERE dataset_id = $1
                    ORDER BY row_index
                    OFFSET $2 LIMIT $3`,
                    [datasetId, offset, PAGE]
                )
                .then(r => r.rows);

            if (rows.length === 0) {
                return { loaded, aborted: false };
            }

            for (const r of rows) {
                cb(r);
                loaded += 1;

                if (loaded > abortIfMoreThan) {
                    return { loaded, aborted: true };
                }
            }

            offset += rows.length;
        }

        return { loaded, aborted: true };
    }

    async bulkAppendRows(
        datasetId: string,
        forwardRows: (appendRow: AppendRowsFn) => Promise<void>
    ): Promise<{ insertedCount: number }> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [datasetId]);

            const [{ nextIndex }] = await client
                .query<{ nextIndex: number }>(
                    `SELECT COALESCE(MAX(row_index), -1) + 1 AS "nextIndex"
                    FROM data.dataset_rows
                    WHERE dataset_id = $1`,
                    [datasetId]
                )
                .then(r => r.rows);

            let currentIndex = nextIndex;
            let insertedCount = 0;
            let batch: Array<{ index: number; data: Record<string, unknown> }> = [];

            const flushBatch = async () => {
                if (batch.length === 0) {
                    return;
                }

                const values: unknown[] = [];
                const placeholders: string[] = [];
                let p = 1;

                for (const row of batch) {
                    placeholders.push(`($${p++}, $${p++}, $${p++}::jsonb)`);
                    values.push(datasetId, row.index, JSON.stringify(row.data));
                }

                await client.query(
                    `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
                    VALUES ${placeholders.join(', ')}`,
                    values
                );

                insertedCount += batch.length;
                batch.length = 0;
            };

            const appendRow: AppendRowsFn = async (data: Record<string, unknown>) => {
                batch.push({ index: currentIndex++, data });

                if (batch.length >= PgDatasetRepo.ROW_BATCH_SIZE) {
                    await flushBatch();
                }
            };

            await forwardRows(appendRow);
            await flushBatch();

            await client.query('COMMIT');

            return { insertedCount };
        } catch (err) {
            await client.query('ROLLBACK');

            throw err;
        } finally {
            client.release();
        }
    }
}
