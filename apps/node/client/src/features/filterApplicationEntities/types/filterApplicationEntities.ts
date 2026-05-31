import type { Action, ActionRunStatus } from '@/entities/action';

export type FilterApplicationScope = 'actions' | 'charts' | 'dashboards' | 'datasets';
export type FilterApplicationEntity =
    | 'charts'
    | 'dashboards'
    | 'datasets'
    | 'effects'
    | 'runs';

export type FilterApplicationEffectKind = Action['effects'][number]['kind'];
export type FilterApplicationRunStatus = ActionRunStatus;

export type FilterApplicationEntityValues = Record<FilterApplicationEntity, string[]>;

export type FilterApplicationEntitiesState = {
    activeTabs: Record<FilterApplicationScope, FilterApplicationEntity>;
    values: Record<FilterApplicationScope, FilterApplicationEntityValues>;
};

export type FilterApplicationTabConfig = {
    entity: FilterApplicationEntity;
    label: string;
};
