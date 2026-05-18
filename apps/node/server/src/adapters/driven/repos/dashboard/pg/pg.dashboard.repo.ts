import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

import {
    isForeignKeyViolation,
    loadScript,
} from '@qualification-work/microservice-utils/pg';
import type { Dashboard } from '@qualification-work/types';

import { NotFoundError } from '@/core/errors';
import type { DashboardMetricSpec, DashboardRepo } from '@/core/ports/driven/repos';

const stackX = 0;
const stackWidth = 12;
const defaultHeight = 4;

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), 'scripts');

type DashboardHead = {
    id: string;
    org_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

export class PgDashboardRepo implements DashboardRepo {
    private readonly findByIdSql: string;
    private readonly addChartItemSql: string;
    private readonly addMetricItemSql: string;
    private readonly reorderItemsSql: string;

    constructor(private readonly pool: Pool) {
        this.findByIdSql = loadScript(join(scriptsDir, 'findById.sql'));
        this.addChartItemSql = loadScript(join(scriptsDir, 'addChartItem.sql'));
        this.addMetricItemSql = loadScript(join(scriptsDir, 'addMetricItem.sql'));
        this.reorderItemsSql = loadScript(join(scriptsDir, 'reorderItems.sql'));
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

        return PgDashboardRepo.toDashboard(rows[0]);
    }

    async listByOrg(
        orgId: string,
        userOrgIds: string[]
    ): Promise<Omit<Dashboard, 'items'>[]> {
        const { rows } = await this.pool.query<DashboardHead>(
            `SELECT id, org_id, name, created_at, updated_at
			FROM dashboards.dashboards
			WHERE org_id = $1 AND org_id = ANY($2::uuid[])
			ORDER BY created_at DESC`,
            [orgId, userOrgIds]
        );

        return rows.map(row => ({
            id: row.id,
            orgId: row.org_id,
            name: row.name,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        }));
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
                stackX,
                stackWidth,
                height ?? defaultHeight,
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
            const { rows } = await this.pool.query<{
                id: string;
                pos_y: number;
            }>(this.addMetricItemSql, [
                dashboardId,
                userOrgIds,
                stackX,
                stackWidth,
                height ?? defaultHeight,
                metric.datasetId,
                metric.name,
                metric.expression,
                metric.format,
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

    async reorderItems(
        dashboardId: string,
        order: Array<{ itemId: string; posY: number }>,
        userOrgIds: string[]
    ): Promise<{ dashboardFound: boolean; updatedCount: number }> {
        if (order.length === 0) {
            const { rows } = await this.pool.query<{ exists: boolean }>(
                `SELECT EXISTS(
					SELECT 1 FROM dashboards.dashboards
					WHERE id = $1 AND org_id = ANY($2::uuid[])
				) AS exists`,
                [dashboardId, userOrgIds]
            );

            return { dashboardFound: rows[0].exists, updatedCount: 0 };
        }

        const itemIds = order.map(o => o.itemId);
        const posYs = order.map(o => o.posY);

        const { rows } = await this.pool.query<{
            dashboard_count: number;
            updated_count: number;
        }>(this.reorderItemsSql, [dashboardId, userOrgIds, itemIds, posYs]);

        return {
            dashboardFound: rows[0].dashboard_count > 0,
            updatedCount: rows[0].updated_count,
        };
    }

    private static toDashboard(
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
}
