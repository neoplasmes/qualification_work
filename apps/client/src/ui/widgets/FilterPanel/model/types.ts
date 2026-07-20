import type {
    FilterApplicationEntity,
    FilterApplicationScope,
} from '@/core/processes/entityFiltering';

export type FilterPanelTestIds = {
    panel?: string;
    chip?: string;
    clearButton?: string;
    tabs?: Partial<Record<FilterApplicationEntity, string>>;
};

export type FilterPanelProps = {
    scope: FilterApplicationScope;
    testIds?: FilterPanelTestIds;
};

export type FilterPanelItem = {
    id: string;
    label: string;
    meta: string[];
    chartKind?: string;
};

export type StaticFilterPanelSourceItem = FilterPanelItem;
