import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

import {
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import {
    isForeignKeyViolation,
    loadScript,
} from '@qualification-work/microservice-utils/postgres';
import {
    dashboardChartDefaultHeight,
    dashboardChartDefaultWidth,
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardMetricDefaultHeight,
    dashboardMetricDefaultWidth,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
    type Dashboard,
    type DashboardItemLayoutInput,
    type DashboardMetricItem,
    type MetricTimeBucket,
    type MetricTrendPoint,
    type PreviewDashboardMetricPayload,
    type PreviewDashboardMetricResponse,
} from '@qualification-work/types';

import type { DashboardMetricSpec, DashboardRepo } from '@/core/ports/driven/repos';
import type {
    MetricAggTerm,
    MetricExpressionNode,
    MetricExpressionTool,
    MetricTermKey,
} from '@/core/ports/driven/tools';

const dashboardGridX = 0;

// aggregates whose column must be numeric
const numericAggregates = new Set(['sum', 'avg', 'min', 'max']);
// fallback bucket when trend is enabled without an explicit one
const defaultTimeBucket: MetricTimeBucket = 'month';
// cap of trend points rendered as a sparkline
const maxTrendPoints = 30;
// whitelist guarding the inlined date_trunc unit
const timeBucketUnits: Record<MetricTimeBucket, string> = {
    day: 'day',
    week: 'week',
    month: 'month',
};
// mirrors chart date grouping: stored date strings may be ISO or DD.MM.YYYY
const buildMetricDateValueExpression = (valueSql: string) =>
    `CASE` +
    ` WHEN ${valueSql} ~ '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$'` +
    ` THEN to_timestamp(${valueSql}, 'DD.MM.YYYY')` +
    ` WHEN ${valueSql} ~ '^\\d{4}-\\d{2}-\\d{2}'` +
    ` THEN ${valueSql}::timestamptz` +
    ` ELSE NULL END`;

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), 'scripts');

type DashboardHead = {
    id: string;
    org_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

type DatasetColumnMeta = {
    dataType: string;
    isAnalyzable: boolean;
};

type DatasetColumns = {
    byKey: Map<string, DatasetColumnMeta>;
    firstDateColumn: string | null;
};

// metric item carrying its parsed expression for the batched evaluation
type ParsedMetric = {
    item: DashboardMetricItem;
    ast: MetricExpressionNode | null;
};

export class PgDashboardRepo implements DashboardRepo {
    private readonly findByIdSql: string;
    private readonly listByOrgSql: string;
    private readonly addChartItemSql: string;
    private readonly addMetricItemSql: string;
    private readonly updateMetricItemSql: string;
    private readonly updateItemsLayoutSql: string;

    constructor(
        private readonly pool: Pool,
        private readonly expressionTool: MetricExpressionTool
    ) {
        this.findByIdSql = loadScript(join(scriptsDir, 'findById.sql'));
        this.listByOrgSql = loadScript(join(scriptsDir, 'listByOrg.sql'));
        this.addChartItemSql = loadScript(join(scriptsDir, 'addChartItem.sql'));
        this.addMetricItemSql = loadScript(join(scriptsDir, 'addMetricItem.sql'));
        this.updateMetricItemSql = loadScript(join(scriptsDir, 'updateMetricItem.sql'));
        this.updateItemsLayoutSql = loadScript(join(scriptsDir, 'updateItemsLayout.sql'));
    }

    async create(orgId: string, name: string): Promise<string> {
        try {
            const { rows } = await this.pool.query<{ id: string }>(
                `INSERT INTO dashboards.dashboards (org_id, name)
				VALUES ($1, $2)
				RETURNING id`,
                [orgId, name]
            );

            return rows[0].id;
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new NotFoundError(`Organization ${orgId} not found`);
            }

            throw error;
        }
    }

    async delete(id: string, userOrgIds: string[]): Promise<boolean> {
        const { rowCount } = await this.pool.query(
            `DELETE FROM dashboards.dashboards
			WHERE id = $1 AND org_id = ANY($2::uuid[])`,
            [id, userOrgIds]
        );

        return Boolean(rowCount);
    }

    async updateName(id: string, name: string, userOrgIds: string[]): Promise<boolean> {
        const { rowCount } = await this.pool.query(
            `UPDATE dashboards.dashboards
			SET name = $2
			WHERE id = $1 AND org_id = ANY($3::uuid[])`,
            [id, name, userOrgIds]
        );

        return Boolean(rowCount);
    }

    async findById(id: string, userOrgIds: string[]): Promise<Dashboard | null> {
        const { rows } = await this.pool.query<
            DashboardHead & { items: Dashboard['items'] }
        >(this.findByIdSql, [id, userOrgIds]);

        if (rows.length === 0) {
            return null;
        }

        return this.toDashboard(rows[0]);
    }

    async listByOrg(orgId: string, userOrgIds: string[]): Promise<Dashboard[]> {
        const { rows } = await this.pool.query<
            DashboardHead & { items: Dashboard['items'] }
        >(this.listByOrgSql, [orgId, userOrgIds]);

        return rows.map(row => this.toDashboardSummary(row));
    }

    async previewMetric(
        metric: PreviewDashboardMetricPayload,
        userOrgIds: string[]
    ): Promise<PreviewDashboardMetricResponse | null> {
        const isReadable = await this.datasetIsReadable(metric.datasetId, userOrgIds);
        if (!isReadable) {
            return null;
        }

        const ast = this.expressionTool.parse(metric.expression);
        const terms = this.expressionTool.collectTerms(ast);
        const columns = await this.loadDatasetColumns(metric.datasetId);

        for (const term of terms) {
            if (term.column === null) {
                continue;
            }

            const meta = columns.byKey.get(term.column);
            if (meta && !meta.isAnalyzable) {
                throw new ValidationError(
                    [term.column],
                    `Column "${term.column}" is not included in analysis`
                );
            }
        }

        if (!this.termsAreValid(ast, columns.byKey)) {
            return { value: null };
        }

        const values = await this.computeScalarValues(metric.datasetId, [
            { item: this.toPreviewMetricItem(metric), ast },
        ]);

        return { value: this.expressionTool.evaluate(ast, values) };
    }

    async addChartItem(
        dashboardId: string,
        chartId: string,
        height: number | undefined,
        userOrgIds: string[]
    ): Promise<{ itemId: string; posY: number } | null> {
        try {
            const { rows } = await this.pool.query<{
                id: string;
                pos_y: number;
            }>(this.addChartItemSql, [
                dashboardId,
                userOrgIds,
                dashboardGridX,
                dashboardChartDefaultWidth,
                height ?? dashboardChartDefaultHeight,
                chartId,
            ]);

            if (rows.length === 0) {
                return null;
            }

            return { itemId: rows[0].id, posY: rows[0].pos_y };
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new NotFoundError(`Chart ${chartId} not found`);
            }

            throw error;
        }
    }

    async addMetricItem(
        dashboardId: string,
        metric: DashboardMetricSpec,
        height: number | undefined,
        userOrgIds: string[]
    ): Promise<{ itemId: string; posY: number } | null> {
        try {
            await this.assertMetricExpressionIsValid(metric);

            const { rows } = await this.pool.query<{
                id: string;
                pos_y: number;
            }>(this.addMetricItemSql, [
                dashboardId,
                userOrgIds,
                dashboardGridX,
                dashboardMetricDefaultWidth,
                height ?? dashboardMetricDefaultHeight,
                metric.datasetId,
                metric.name,
                metric.expression,
                metric.format,
                metric.showTrend,
                metric.timeColumn,
                metric.timeBucket,
                metric.target,
                metric.targetDirection,
                metric.valueMultiplier ?? 1,
            ]);

            if (rows.length === 0) {
                return null;
            }

            return { itemId: rows[0].id, posY: rows[0].pos_y };
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new NotFoundError(`Dataset ${metric.datasetId} not found`);
            }

            throw error;
        }
    }

    async updateMetricItem(
        dashboardId: string,
        itemId: string,
        metric: DashboardMetricSpec,
        userOrgIds: string[]
    ): Promise<boolean> {
        try {
            await this.assertMetricExpressionIsValid(metric);

            const { rowCount } = await this.pool.query(this.updateMetricItemSql, [
                dashboardId,
                itemId,
                userOrgIds,
                metric.datasetId,
                metric.name,
                metric.expression,
                metric.format,
                metric.showTrend,
                metric.timeColumn,
                metric.timeBucket,
                metric.target,
                metric.targetDirection,
                metric.valueMultiplier ?? 1,
            ]);

            return Boolean(rowCount);
        } catch (error) {
            if (isForeignKeyViolation(error)) {
                throw new NotFoundError(`Dataset ${metric.datasetId} not found`);
            }

            throw error;
        }
    }

    async removeItem(
        dashboardId: string,
        itemId: string,
        userOrgIds: string[]
    ): Promise<boolean> {
        const { rowCount } = await this.pool.query(
            `DELETE FROM dashboards.dashboard_items di
			USING dashboards.dashboards d
			WHERE di.id = $2
				AND di.dashboard_id = $1
				AND d.id = di.dashboard_id
				AND d.org_id = ANY($3::uuid[])`,
            [dashboardId, itemId, userOrgIds]
        );

        return Boolean(rowCount);
    }

    async updateItemsLayout(
        dashboardId: string,
        layout: DashboardItemLayoutInput[],
        userOrgIds: string[]
    ): Promise<{
        dashboardFound: boolean;
        itemCount: number;
        matchedCount: number;
        invalidSizeCount: number;
        updatedCount: number;
    }> {
        const itemIds = layout.map(o => o.itemId);
        const posXs = layout.map(o => o.posX);
        const posYs = layout.map(o => o.posY);
        const widths = layout.map(o => o.width);
        const heights = layout.map(o => o.height);

        const { rows } = await this.pool.query<{
            dashboard_count: number;
            item_count: number;
            matched_count: number;
            invalid_size_count: number;
            updated_count: number;
        }>(this.updateItemsLayoutSql, [
            dashboardId,
            userOrgIds,
            itemIds,
            posXs,
            posYs,
            widths,
            heights,
            dashboardMetricMinWidth,
            dashboardMetricMinHeight,
            dashboardChartMinWidth,
            dashboardChartMinHeight,
        ]);

        return {
            dashboardFound: rows[0].dashboard_count > 0,
            itemCount: rows[0].item_count,
            matchedCount: rows[0].matched_count,
            invalidSizeCount: rows[0].invalid_size_count,
            updatedCount: rows[0].updated_count,
        };
    }

    private async datasetIsReadable(
        datasetId: string,
        userOrgIds: string[]
    ): Promise<boolean> {
        const { rows } = await this.pool.query<{ exists: boolean }>(
            `SELECT EXISTS (
                SELECT 1
                FROM data.datasets
                WHERE id = $1 AND org_id = ANY($2::uuid[])
            ) AS exists`,
            [datasetId, userOrgIds]
        );

        return rows[0]?.exists ?? false;
    }

    private toPreviewMetricItem(
        metric: PreviewDashboardMetricPayload
    ): DashboardMetricItem {
        return {
            id: 'preview',
            kind: 'metric',
            datasetId: metric.datasetId,
            name: 'Preview',
            expression: metric.expression,
            format: '',
            valueMultiplier: 1,
            target: null,
            targetDirection: null,
            showTrend: false,
            timeColumn: null,
            timeBucket: null,
            layout: {
                posX: dashboardGridX,
                posY: 0,
                width: dashboardMetricDefaultWidth,
                height: dashboardMetricDefaultHeight,
            },
        };
    }

    private async toDashboard(
        row: DashboardHead & { items: Dashboard['items'] }
    ): Promise<Dashboard> {
        const items = await this.enrichMetricItems(row.items);

        return {
            id: row.id,
            orgId: row.org_id,
            name: row.name,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            items,
        };
    }

    private toDashboardSummary(
        row: DashboardHead & { items: Dashboard['items'] }
    ): Dashboard {
        return {
            id: row.id,
            orgId: row.org_id,
            name: row.name,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            items: row.items,
        };
    }

    /**
     * enriches metric items with computed value and optional trend
     * metrics are grouped by dataset so each dataset is scanned once for all its
     * scalar values, turning the former per-metric N+1 into 2 queries per dataset
     *
     * @param items
     * @returns items with metric values resolved
     */
    private async enrichMetricItems(
        items: Dashboard['items']
    ): Promise<Dashboard['items']> {
        const byDataset = new Map<string, ParsedMetric[]>();

        for (const item of items) {
            if (item.kind !== 'metric') {
                continue;
            }

            const ast = this.safeParse(item.expression);
            const group = byDataset.get(item.datasetId);
            if (group) {
                group.push({ item, ast });
            } else {
                byDataset.set(item.datasetId, [{ item, ast }]);
            }
        }

        if (byDataset.size === 0) {
            return items;
        }

        const computed = new Map<
            string,
            { value: number | null; trend: MetricTrendPoint[] | null }
        >();
        await Promise.all(
            [...byDataset].map(([datasetId, metrics]) =>
                this.evaluateDataset(datasetId, metrics, computed)
            )
        );

        return items.map(item => {
            if (item.kind !== 'metric') {
                return item;
            }

            const result = computed.get(item.id);

            return {
                ...item,
                value: result?.value ?? null,
                trend: result?.trend ?? null,
            };
        });
    }

    /**
     * evaluates every metric of a single dataset in one scalar scan
     * plus one grouped scan per trend-enabled metric
     *
     * @param datasetId
     * @param metrics
     * @param out
     * @returns
     */
    private async evaluateDataset(
        datasetId: string,
        metrics: ParsedMetric[],
        out: Map<string, { value: number | null; trend: MetricTrendPoint[] | null }>
    ): Promise<void> {
        const columns = await this.loadDatasetColumns(datasetId);

        // keep only metrics whose terms all resolve against valid columns
        const valid = metrics.filter(
            metric => metric.ast !== null && this.termsAreValid(metric.ast, columns.byKey)
        );

        const values = await this.computeScalarValues(datasetId, valid);

        for (const metric of metrics) {
            const value =
                metric.ast && valid.includes(metric)
                    ? this.expressionTool.evaluate(metric.ast, values)
                    : null;
            out.set(metric.item.id, { value, trend: null });
        }

        await Promise.all(
            valid
                .filter(metric => metric.item.showTrend)
                .map(metric => this.attachTrend(datasetId, metric, columns, out))
        );
    }

    /**
     * runs the single batched aggregate scan for the dataset
     *
     * @param datasetId
     * @param metrics valid metrics whose terms feed the scan
     * @returns term key -> scalar value map
     */
    private async computeScalarValues(
        datasetId: string,
        metrics: ParsedMetric[]
    ): Promise<Map<MetricTermKey, number | null>> {
        const values = new Map<MetricTermKey, number | null>();
        const terms = this.collectDatasetTerms(metrics);
        if (terms.length === 0) {
            return values;
        }

        const built = this.buildAggregateSelect(terms, 2);
        const sql = `SELECT ${built.selects.join(', ')}
            FROM data.dataset_rows
            WHERE dataset_id = $1`;

        try {
            const { rows } = await this.pool.query<
                Record<string, string | number | null>
            >(sql, [datasetId, ...built.params]);
            this.readTermValues(rows[0], built.aliasByKey, values);
        } catch {
            // a malformed value would fail the whole scan, leave values empty -> null metrics
        }

        return values;
    }

    /**
     * runs one grouped scan and folds it into a trend series for a metric
     *
     * @param datasetId
     * @param metric
     * @param columns
     * @param out
     * @returns
     */
    private async attachTrend(
        datasetId: string,
        metric: ParsedMetric,
        columns: DatasetColumns,
        out: Map<string, { value: number | null; trend: MetricTrendPoint[] | null }>
    ): Promise<void> {
        if (!metric.ast) {
            return;
        }

        const timeColumn = this.resolveTimeColumn(metric.item, columns);
        if (!timeColumn) {
            return;
        }

        const bucketUnit = timeBucketUnits[metric.item.timeBucket ?? defaultTimeBucket];
        const terms = this.expressionTool.collectTerms(metric.ast);
        const built = this.buildAggregateSelect(terms, 3);
        const dateValueExpr = `NULLIF(btrim(data->>$2), '')`;
        const dateExpr = buildMetricDateValueExpression(dateValueExpr);
        const sql = `SELECT
                date_trunc('${bucketUnit}', ${dateExpr}) AS bucket,
                ${built.selects.join(', ')}
            FROM data.dataset_rows
            WHERE dataset_id = $1 AND ${dateValueExpr} IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket`;

        try {
            const { rows } = await this.pool.query<
                { bucket: Date | null } & Record<string, string | number | null>
            >(sql, [datasetId, timeColumn, ...built.params]);

            const series: MetricTrendPoint[] = rows
                .filter(row => row.bucket !== null)
                .map(row => {
                    const values = new Map<MetricTermKey, number | null>();
                    this.readTermValues(row, built.aliasByKey, values);

                    return {
                        bucket: (row.bucket as Date).toISOString(),
                        value: this.expressionTool.evaluate(metric.ast!, values),
                    };
                });

            const existing = out.get(metric.item.id);
            out.set(metric.item.id, {
                value: existing?.value ?? null,
                trend: series.slice(-maxTrendPoints),
            });
        } catch {
            // bad date values must not break the dashboard read, keep trend null
        }
    }

    private resolveTimeColumn(
        item: DashboardMetricItem,
        columns: DatasetColumns
    ): string | null {
        if (item.timeColumn) {
            const meta = columns.byKey.get(item.timeColumn);

            return meta?.dataType === 'date' ? item.timeColumn : null;
        }

        return columns.firstDateColumn;
    }

    private collectDatasetTerms(metrics: ParsedMetric[]): MetricAggTerm[] {
        const byKey = new Map<MetricTermKey, MetricAggTerm>();

        for (const metric of metrics) {
            if (!metric.ast) {
                continue;
            }

            for (const term of this.expressionTool.collectTerms(metric.ast)) {
                byKey.set(this.expressionTool.termKey(term), term);
            }
        }

        return [...byKey.values()];
    }

    private buildAggregateSelect(
        terms: MetricAggTerm[],
        firstParamIndex: number
    ): {
        selects: string[];
        params: string[];
        aliasByKey: Map<MetricTermKey, string>;
    } {
        const selects: string[] = [];
        const params: string[] = [];
        const aliasByKey = new Map<MetricTermKey, string>();
        let paramIndex = firstParamIndex;

        terms.forEach((term, index) => {
            const alias = `t${index}`;
            aliasByKey.set(this.expressionTool.termKey(term), alias);

            if (term.column === null) {
                selects.push(`count(*)::numeric AS ${alias}`);

                return;
            }

            const valueExpr = `NULLIF(data->>$${paramIndex}, '')`;
            params.push(term.column);
            paramIndex += 1;

            if (term.aggregate === 'count') {
                selects.push(`count(${valueExpr})::numeric AS ${alias}`);
            } else if (term.aggregate === 'count_distinct') {
                selects.push(`count(distinct ${valueExpr})::numeric AS ${alias}`);
            } else {
                selects.push(`${term.aggregate}(${valueExpr}::numeric) AS ${alias}`);
            }
        });

        return { selects, params, aliasByKey };
    }

    private readTermValues(
        row: Record<string, string | number | null> | undefined,
        aliasByKey: Map<MetricTermKey, string>,
        out: Map<MetricTermKey, number | null>
    ): void {
        if (!row) {
            return;
        }

        for (const [key, alias] of aliasByKey) {
            const raw = row[alias];
            out.set(key, raw === null || raw === undefined ? null : Number(raw));
        }
    }

    /**
     * read-time term validity, mirrors the legacy evaluator
     * a referenced column must exist and be numeric for arithmetic aggregates
     * analyzability is enforced only on write, saved metrics keep evaluating
     *
     * @param ast
     * @param columns
     * @returns
     */
    private termsAreValid(
        ast: MetricExpressionNode,
        columns: Map<string, DatasetColumnMeta>
    ): boolean {
        return this.expressionTool.collectTerms(ast).every(term => {
            if (term.column === null) {
                return true;
            }

            const meta = columns.get(term.column);
            if (!meta) {
                return false;
            }

            return !numericAggregates.has(term.aggregate) || meta.dataType === 'number';
        });
    }

    private safeParse(expression: string): MetricExpressionNode | null {
        try {
            return this.expressionTool.parse(expression);
        } catch {
            return null;
        }
    }

    private async loadDatasetColumns(datasetId: string): Promise<DatasetColumns> {
        const { rows } = await this.pool.query<{
            key: string;
            data_type: string;
            is_analyzable: boolean;
        }>(
            `SELECT key, data_type, is_analyzable
            FROM data.dataset_columns
            WHERE dataset_id = $1
            ORDER BY order_index`,
            [datasetId]
        );

        const byKey = new Map<string, DatasetColumnMeta>();
        let firstDateColumn: string | null = null;

        for (const row of rows) {
            byKey.set(row.key, {
                dataType: row.data_type,
                isAnalyzable: row.is_analyzable,
            });

            if (firstDateColumn === null && row.data_type === 'date') {
                firstDateColumn = row.key;
            }
        }

        return { byKey, firstDateColumn };
    }

    /**
     * validates that columns referenced by the expression are analyzable
     * the deep grammar check happens in the parser, rejecting malformed input
     *
     * @param metric
     * @returns
     */
    private async assertMetricExpressionIsValid(
        metric: DashboardMetricSpec
    ): Promise<void> {
        const ast = this.expressionTool.parse(metric.expression);
        const terms = this.expressionTool.collectTerms(ast);
        const named = terms
            .map(term => term.column)
            .filter((c): c is string => c !== null);
        if (named.length === 0) {
            return;
        }

        const columns = await this.loadDatasetColumns(metric.datasetId);
        for (const column of named) {
            const meta = columns.byKey.get(column);
            if (meta && !meta.isAnalyzable) {
                throw new ValidationError(
                    [column],
                    `Column "${column}" is not included in analysis`
                );
            }
        }
    }
}
