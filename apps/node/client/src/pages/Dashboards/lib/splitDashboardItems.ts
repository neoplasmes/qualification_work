import type { DashboardItem } from '@/entities/dashboard';

export const splitDashboardItems = (items: DashboardItem[]) => {
    const metricItems: Array<Extract<DashboardItem, { kind: 'metric' }>> = [];
    const chartItems: Array<Extract<DashboardItem, { kind: 'chart' }>> = [];

    for (const item of items) {
        if (item.kind === 'metric') {
            metricItems.push(item);
        } else {
            chartItems.push(item);
        }
    }

    return { metricItems, chartItems };
};
