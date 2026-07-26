import type { DashboardItem } from '../dashboardItem';

export type Dashboard = {
    readonly ref: `dashboard:${string}`;
    id: string;
    orgId: string;
    name: string;
    items: DashboardItem[];
    createdAt: string;
    updatedAt: string;
};
