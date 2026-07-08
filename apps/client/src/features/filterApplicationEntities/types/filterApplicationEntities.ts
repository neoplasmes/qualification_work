import type { Action } from '@/entities/action';

export type FilterApplicationScope = 'actions' | 'charts' | 'dashboards' | 'datasets';
export type FilterApplicationEntity = 'charts' | 'dashboards' | 'datasets' | 'effects';

export type FilterApplicationEffectKind = Action['effects'][number]['kind'];

export type FilterApplicationEntityValues = Record<FilterApplicationEntity, string[]>;

export type FilterApplicationEntitiesState = {
    activeTabs: Record<FilterApplicationScope, FilterApplicationEntity>;
    values: Record<FilterApplicationScope, FilterApplicationEntityValues>;
};

export type FilterApplicationTabConfig = {
    entity: FilterApplicationEntity;
    label: string;
};
