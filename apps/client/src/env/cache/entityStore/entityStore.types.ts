import type { Action } from '@/core/entities/action';
import type { ActionRun } from '@/core/entities/actionRun';
import type { Chart } from '@/core/entities/chart';
import type { Dashboard } from '@/core/entities/dashboard';
import type { DashboardItem } from '@/core/entities/dashboardItem';
import type { Dataset } from '@/core/entities/dataset';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import type { Organization } from '@/core/entities/organization';
import type { User } from '@/core/entities/user';

export interface RecordRowMap {
    user: User;
    organization: Organization;
    dataset: Dataset;
    datasetColumn: DatasetColumn;
    datasetRow: DatasetRow;
    chart: Chart;
    dashboard: Omit<Dashboard, 'items'> & {
        readonly ref: `dashboard:${string}`;
        items: RecordRef<'dashboardItem'>[];
    };
    dashboardItem: DashboardItem;
    action: Action;
    actionRun: ActionRun;
}

export type RecordKind = keyof RecordRowMap;
export type RecordRef<K extends RecordKind = RecordKind> = `${K}:${string}`;
export type NormalizedRowMap = {
    [K in RecordKind]: Partial<RecordRowMap[K]> & { readonly ref: RecordRef<K> };
};
export type NormalizedRow = NormalizedRowMap[RecordKind];
export type RecordPatch<K extends RecordKind = RecordKind> = {
    [P in K]: Partial<RecordRowMap[P]>;
}[K];
export type StoreWrite = {
    [K in RecordKind]:
        | { kind: 'upsert'; ref: RecordRef<K>; patch: RecordPatch<K> }
        | { kind: 'remove'; ref: RecordRef<K> };
}[RecordKind];

export interface WriteGuard {
    isCurrent(): boolean;
    signal?: AbortSignal;
}

export interface EntitySnapshot {
    collections: Array<{
        collectionId: string;
        rows: Array<
            {
                [K in RecordKind]: {
                    key: RecordRef<K>;
                    value: NormalizedRowMap[K];
                    metadata?: unknown;
                };
            }[RecordKind]
        >;
        syncMeta?: unknown;
    }>;
}

export interface StagingStore {
    get<K extends RecordKind>(ref: RecordRef<K>): NormalizedRowMap[K] | undefined;
    upsert<K extends RecordKind>(
        ref: RecordRef<K>,
        patch: RecordPatch<NoInfer<K>>
    ): Promise<void>;
    remove(ref: RecordRef): Promise<void>;
}
