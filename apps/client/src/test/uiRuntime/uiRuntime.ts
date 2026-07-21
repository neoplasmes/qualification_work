import { createDependencies } from '@/main/dependencies';
import type { ActionsPageState } from '@/ui/pages/actions';
import {
    createChartsPageStore,
    type ChartsPageState,
    type ChartsPreferences,
} from '@/ui/pages/charts';
import type { DashboardsPageState } from '@/ui/pages/dashboards';
import type { DatasetsPageState } from '@/ui/pages/datasets';
import type { PanelLayoutState } from '@/ui/widgets/WorkspaceGrid';
import type { DatasetMetadata as WireDatasetMetadata } from '@qualification-work/types';
import { afterEach } from 'vitest';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.splice(0).map(runtime => runtime.dispose()));
});
export function createUiTestRuntime(
    initial: {
        datasetMetadata?: WireDatasetMetadata[];
        actions?: Partial<ActionsPageState>;
        charts?: Partial<ChartsPageState & ChartsPreferences>;
        datasets?: Partial<DatasetsPageState>;
        dashboards?: Partial<DashboardsPageState>;
        panelLayout?: Partial<PanelLayoutState>;
    } = {},
    browser = false
) {
    const runtime = createDependencies({
        platform: browser ? 'browser' : 'server',
        apiBaseUrl: '/api',
    });
    runtimes.push(runtime);
    if (initial.datasetMetadata) {
        const metadata = initial.datasetMetadata.map(item => ({
            ...item,
            dataset: {
                ...item.dataset,
                ref: `dataset:${encodeURIComponent(item.dataset.orgId)}/${encodeURIComponent(item.dataset.id)}` as const,
            },
            columns: item.columns.map(column => ({
                ...column,
                ref: `datasetColumn:${encodeURIComponent(item.dataset.orgId)}/${encodeURIComponent(item.dataset.id)}/${encodeURIComponent(column.id)}` as const,
            })),
        }));
        runtime.dependencies.listDatasets.execute = async () => metadata;
    }
    const ui = runtime.dependencies.ui;
    if (initial.actions) {
        ui.actions.setState(initial.actions);
    }
    if (initial.charts) {
        const {
            rememberedChartId = null,
            rememberedMode = 'view',
            chartsRightPanelTab = 'properties',
        } = initial.charts;
        ui.charts.setState({ rememberedChartId, rememberedMode, chartsRightPanelTab });
    }
    if (initial.datasets) {
        ui.datasets.setState(initial.datasets);
    }
    if (initial.dashboards) {
        ui.dashboards.setState(initial.dashboards);
    }
    if (initial.panelLayout) {
        ui.panelLayout.setState(initial.panelLayout);
    }

    return { runtime, ui, chartEditor: createChartsPageStore(initial.charts) };
}
