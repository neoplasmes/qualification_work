import type { createActionsPageStore } from '@/ui/pages/actions';
import type { createChartsPreferencesStore } from '@/ui/pages/charts';
import type { createDashboardsPageStore } from '@/ui/pages/dashboards';
import type { createDatasetsPageStore } from '@/ui/pages/datasets';
import type { createFiltersStore } from '@/ui/widgets/FilterPanel';
import type { createActiveOrganizationStore } from '@/ui/widgets/NavBar';
import type { createPanelLayoutStore } from '@/ui/widgets/WorkspaceGrid';

export interface UiState {
    actions: ReturnType<typeof createActionsPageStore>;
    charts: ReturnType<typeof createChartsPreferencesStore>;
    datasets: ReturnType<typeof createDatasetsPageStore>;
    dashboards: ReturnType<typeof createDashboardsPageStore>;
    filters: ReturnType<typeof createFiltersStore>;
    panelLayout: ReturnType<typeof createPanelLayoutStore>;
    activeOrganization: ReturnType<typeof createActiveOrganizationStore>;
    hydrate(): void;
    reset(): void;
    dispose(): void;
}
