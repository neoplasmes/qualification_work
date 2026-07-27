import type {
    FilterApplicationEffectKind,
    FilterApplicationScope,
    FilterApplicationTabConfig,
} from '@/core/processes/entityFiltering';

type FilterApplicationEntityConfig = {
    tabs: readonly FilterApplicationTabConfig[];
};

export const filterApplicationEntityConfigs = {
    actions: {
        tabs: [
            { entity: 'datasets', label: 'Таблицы' },
            { entity: 'effects', label: 'Эффекты' },
        ],
    },
    charts: {
        tabs: [
            { entity: 'datasets', label: 'Таблицы' },
            { entity: 'dashboards', label: 'Дашборды' },
        ],
    },
    dashboards: {
        tabs: [
            { entity: 'charts', label: 'Графики' },
            { entity: 'datasets', label: 'Таблицы' },
        ],
    },
    datasets: {
        tabs: [
            { entity: 'charts', label: 'Графики' },
            { entity: 'dashboards', label: 'Дашборды' },
        ],
    },
} as const satisfies Record<FilterApplicationScope, FilterApplicationEntityConfig>;

export const filterApplicationEffectKinds = [
    'insertRow',
    'updateRowsByMatch',
] as const satisfies readonly FilterApplicationEffectKind[];
