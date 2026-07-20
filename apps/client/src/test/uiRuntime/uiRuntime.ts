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
import { afterEach } from 'vitest';

const runtimes: ReturnType<typeof createDependencies>[] = [];
afterEach(async () => {
    await Promise.all(runtimes.splice(0).map(runtime => runtime.dispose()));
});
export function createUiTestRuntime(
    initial: {
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
