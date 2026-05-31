import type { ActionRunStatus } from '@/entities/action';

import type {
    FilterApplicationEffectKind,
    FilterApplicationScope,
    FilterApplicationTabConfig,
} from '../types';

type FilterApplicationEntityConfig = {
    tabs: readonly FilterApplicationTabConfig[];
};

export const filterApplicationEntityConfigs = {
    actions: {
        tabs: [
            { entity: 'datasets', label: 'Datasets' },
            { entity: 'effects', label: 'Effects' },
            { entity: 'runs', label: 'Runs' },
        ],
    },
    charts: {
        tabs: [
            { entity: 'datasets', label: 'Datasets' },
            { entity: 'dashboards', label: 'Dashboards' },
        ],
    },
    dashboards: {
        tabs: [
            { entity: 'charts', label: 'Charts' },
            { entity: 'datasets', label: 'Datasets' },
        ],
    },
    datasets: {
        tabs: [
            { entity: 'charts', label: 'Charts' },
            { entity: 'dashboards', label: 'Dashboards' },
        ],
    },
} as const satisfies Record<FilterApplicationScope, FilterApplicationEntityConfig>;

export const filterApplicationEffectKinds = [
    'insertRow',
    'updateRowsByMatch',
] as const satisfies readonly FilterApplicationEffectKind[];

export const filterApplicationRunStatuses = [
    'success',
    'failed',
] as const satisfies readonly ActionRunStatus[];
