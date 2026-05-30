import type { Pool, PoolClient } from 'pg';

import type { Action, ActionRun, DatasetColumn } from '@/core/domain';
import { ConflictError, NotFoundError } from '@/core/errors';
import type {
    ActionRepo,
    CreateActionPayload,
    CreateFailedRunPayload,
    DatasetActionContext,
    ExecuteActionPayload,
    ListActionRunsPayload,
    UpdateActionPayload,
} from '@/core/ports/driven/repos';

type ActionRow = {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    parameters: Action['parameters'];
    effects: Action['effects'];
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
};

type ActionRunRow = {
    id: string;
    actionId: string;
    orgId: string;
    userId: string;
    parameters: ActionRun['parameters'];
    changes: ActionRun['changes'];
    status: ActionRun['status'];
    errorMessage: string | null;
    executedAt: Date;
};

type DatasetRowRecord = {
    id: string;
    rowIndex: number;
    data: Record<string, unknown>;
};

const SELECT_ACTION = `
    SELECT
        id,
        org_id      AS "orgId",
        name,
        description,
        parameters,
        effects,
        created_at  AS "createdAt",
        updated_at  AS "updatedAt",
        archived_at AS "archivedAt"
    FROM actions.actions
`;

const SELECT_RUN = `
    SELECT
        id,
        action_id     AS "actionId",
        org_id        AS "orgId",
        user_id       AS "userId",
        parameters,
        changes,
        status,
        error_message AS "errorMessage",
        executed_at   AS "executedAt"
    FROM actions.action_runs
`;

export class PgActionRepo implements ActionRepo {
    constructor(private readonly pool: Pool) {}

    async create(data: CreateActionPayload): Promise<{ id: string }> {
        const [row] = await this.pool
            .query<{ id: string }>(
                `INSERT INTO actions.actions (org_id, name, description, parameters, effects)
                 VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
                 RETURNING id`,
                [
                    data.orgId,
                    data.name,
                    data.description,
                    JSON.stringify(data.parameters),
                    JSON.stringify(data.effects),
                ]
            )
            .then(result => result.rows);

        return { id: row.id };
    }

    async update(actionId: string, data: UpdateActionPayload): Promise<void> {
        await this.pool.query(
            `UPDATE actions.actions
             SET name = $2,
                 description = $3,
                 parameters = $4::jsonb,
                 effects = $5::jsonb
             WHERE id = $1 AND archived_at IS NULL`,
            [
                actionId,
                data.name,
                data.description,
                JSON.stringify(data.parameters),
                JSON.stringify(data.effects),
            ]
        );
    }

    async archive(actionId: string): Promise<void> {
        await this.pool.query(
            `UPDATE actions.actions
             SET archived_at = COALESCE(archived_at, now())
             WHERE id = $1`,
            [actionId]
        );
    }

    async getById(
        actionId: string,
        opts: { includeArchived?: boolean } = {}
    ): Promise<Action | null> {
        const archivedPredicate = opts.includeArchived ? '' : ' AND archived_at IS NULL';
        const [row] = await this.pool
            .query<ActionRow>(`${SELECT_ACTION} WHERE id = $1${archivedPredicate}`, [
                actionId,
            ])
            .then(result => result.rows);

        return row ?? null;
    }

    async getByOrgId(orgId: string): Promise<Action[]> {
        return this.pool
            .query<ActionRow>(
                `${SELECT_ACTION}
                 WHERE org_id = $1 AND archived_at IS NULL
                 ORDER BY created_at DESC, name ASC`,
                [orgId]
            )
            .then(result => result.rows);
    }

    async listRuns(data: ListActionRunsPayload): Promise<ActionRun[]> {
        if (data.kind === 'action') {
            return this.pool
                .query<ActionRunRow>(
                    `${SELECT_RUN}
                     WHERE action_id = $1 AND org_id = $2
                     ORDER BY executed_at DESC
                     OFFSET $3
                     LIMIT $4`,
                    [data.actionId, data.orgId, data.offset, data.limit]
                )
                .then(result => result.rows);
        }

        return this.pool
            .query<ActionRunRow>(
                `${SELECT_RUN}
                 WHERE org_id = $1
                 ORDER BY executed_at DESC
                 OFFSET $2
                 LIMIT $3`,
                [data.orgId, data.offset, data.limit]
            )
            .then(result => result.rows);
    }

    async getDatasetContexts(datasetIds: string[]): Promise<DatasetActionContext[]> {
        if (datasetIds.length === 0) {
            return [];
        }

        const datasets = await this.pool
            .query<{ datasetId: string; orgId: string }>(
                `SELECT id AS "datasetId", org_id AS "orgId"
                 FROM data.datasets
                 WHERE id = ANY($1::uuid[])`,
                [datasetIds]
            )
            .then(result => result.rows);

        if (datasets.length === 0) {
            return [];
        }

        const columns = await this.pool
            .query<DatasetColumn>(
                `SELECT
                    id,
                    dataset_id    AS "datasetId",
                    key,
                    display_name  AS "displayName",
                    data_type     AS "dataType",
                    order_index   AS "orderIndex",
                    is_analyzable AS "isAnalyzable"
                 FROM data.dataset_columns
                 WHERE dataset_id = ANY($1::uuid[])
                 ORDER BY dataset_id, order_index`,
                [datasetIds]
            )
            .then(result => result.rows);

        const columnsByDatasetId = new Map<string, DatasetColumn[]>();
        for (const column of columns) {
            const current = columnsByDatasetId.get(column.datasetId) ?? [];
            current.push(column);
            columnsByDatasetId.set(column.datasetId, current);
        }

        return datasets.map(dataset => ({
            datasetId: dataset.datasetId,
            orgId: dataset.orgId,
            columns: columnsByDatasetId.get(dataset.datasetId) ?? [],
        }));
    }

    async executeAction(data: ExecuteActionPayload): Promise<ActionRun> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const changes: ActionRun['changes'] = [];

            for (const effect of data.effects) {
                if (effect.kind === 'insertRow') {
                    changes.push(
                        await this.insertRow(client, effect.datasetId, effect.values)
                    );

                    continue;
                }

                changes.push(
                    await this.updateRowsByMatch(
                        client,
                        effect.datasetId,
                        effect.match.columnKey,
                        effect.match.value,
                        effect.values,
                        effect.maxRows
                    )
                );
            }

            const run = await this.insertRun(client, {
                actionId: data.actionId,
                orgId: data.orgId,
                userId: data.userId,
                parameters: data.parameters,
                changes,
                status: 'success',
                errorMessage: null,
            });

            await client.query('COMMIT');

            return run;
        } catch (err) {
            await client.query('ROLLBACK');

            throw err;
        } finally {
            client.release();
        }
    }

    async createFailedRun(data: CreateFailedRunPayload): Promise<ActionRun> {
        return this.insertRun(this.pool, {
            actionId: data.actionId,
            orgId: data.orgId,
            userId: data.userId,
            parameters: data.parameters,
            changes: [],
            status: 'failed',
            errorMessage: data.errorMessage,
        });
    }

    private async insertRow(
        client: PoolClient,
        datasetId: string,
        data: Record<string, unknown>
    ): Promise<ActionRun['changes'][number]> {
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
            .query<{
                id: string;
                rowIndex: number;
                data: Record<string, unknown>;
            }>(
                `INSERT INTO data.dataset_rows (dataset_id, row_index, data)
                 VALUES ($1, $2, $3::jsonb)
                 RETURNING id, row_index AS "rowIndex", data`,
                [datasetId, nextIndex, JSON.stringify(data)]
            )
            .then(result => result.rows);

        return {
            kind: 'insertRow',
            datasetId,
            rowId: row.id,
            rowIndex: row.rowIndex,
            data: row.data,
        };
    }

    private async updateRowsByMatch(
        client: PoolClient,
        datasetId: string,
        columnKey: string,
        matchValue: unknown,
        values: Record<string, unknown>,
        maxRows: number
    ): Promise<ActionRun['changes'][number]> {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [datasetId]);

        const before = await client
            .query<DatasetRowRecord>(
                `SELECT id, row_index AS "rowIndex", data
                 FROM data.dataset_rows
                 WHERE dataset_id = $1 AND data -> $2 = $3::jsonb
                 ORDER BY row_index
                 LIMIT $4
                 FOR UPDATE`,
                [datasetId, columnKey, JSON.stringify(matchValue), maxRows + 1]
            )
            .then(result => result.rows);

        if (before.length === 0) {
            throw new NotFoundError('No rows matched action');
        }

        if (before.length > maxRows) {
            throw new ConflictError(`Action matched more than ${maxRows} rows`);
        }

        const rowIds = before.map(row => row.id);
        const after = await client
            .query<DatasetRowRecord>(
                `UPDATE data.dataset_rows
                 SET data = data || $3::jsonb
                 WHERE dataset_id = $1 AND id = ANY($2::uuid[])
                 RETURNING id, row_index AS "rowIndex", data`,
                [datasetId, rowIds, JSON.stringify(values)]
            )
            .then(result =>
                result.rows.sort((a, b) => rowIds.indexOf(a.id) - rowIds.indexOf(b.id))
            );

        return {
            kind: 'updateRowsByMatch',
            datasetId,
            match: {
                columnKey,
                value: matchValue,
            },
            rowIds,
            before: before.map(row => ({
                rowId: row.id,
                rowIndex: row.rowIndex,
                data: row.data,
            })),
            after: after.map(row => ({
                rowId: row.id,
                rowIndex: row.rowIndex,
                data: row.data,
            })),
        };
    }

    private async insertRun(
        queryable: Pick<Pool | PoolClient, 'query'>,
        data: Omit<ActionRun, 'id' | 'executedAt'>
    ): Promise<ActionRun> {
        const [row] = await queryable
            .query<ActionRunRow>(
                `INSERT INTO actions.action_runs
                    (action_id, org_id, user_id, parameters, changes, status, error_message)
                 VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
                 RETURNING
                    id,
                    action_id     AS "actionId",
                    org_id        AS "orgId",
                    user_id       AS "userId",
                    parameters,
                    changes,
                    status,
                    error_message AS "errorMessage",
                    executed_at   AS "executedAt"`,
                [
                    data.actionId,
                    data.orgId,
                    data.userId,
                    JSON.stringify(data.parameters),
                    JSON.stringify(data.changes),
                    data.status,
                    data.errorMessage,
                ]
            )
            .then(result => result.rows);

        return row;
    }
}
