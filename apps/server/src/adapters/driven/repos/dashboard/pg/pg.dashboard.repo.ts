import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

import {
    NotFoundError,
    ValidationError,
} from '@qualification-work/microservice-utils/errors';
import type { MetricExpressionTool } from '@qualification-work/microservice-utils/metricExpression';
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
} from '@qualification-work/types';

import type { DashboardMetricSpec, DashboardRepo } from '@/core/ports/driven/repos';

const dashboardGridX = 0;

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), 'scripts');

type DashboardHead = {
    id: string;
    org_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

type DatasetColumnRef = {
    key: string;
    isAnalyzable: boolean;
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

        return rows.map(row => this.toDashboard(row));
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

    private toDashboard(row: DashboardHead & { items: Dashboard['items'] }): Dashboard {
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

        const { rows } = await this.pool.query<{ columns: DatasetColumnRef[] }>(
            'SELECT columns FROM dashboards.dataset_refs WHERE id = $1',
            [metric.datasetId]
        );
        if (rows.length === 0) {
            throw new NotFoundError(`Dataset ${metric.datasetId} not found`);
        }

        for (const column of named) {
            const ref = rows[0].columns.find(({ key }) => key === column);
            if (ref && !ref.isAnalyzable) {
                throw new ValidationError(
                    [column],
                    `Column "${column}" is not included in analysis`
                );
            }
        }
    }
}
