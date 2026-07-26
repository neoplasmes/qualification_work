import type { Action } from '@/core/entities/action';
import type { ActionRun } from '@/core/entities/actionRun';
import type { Chart, ChartData } from '@/core/entities/chart';
import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import type { Session } from '@/core/entities/user';
import { createContext, useContext } from 'react';

import type { Command } from '@/app/commands/command';
import type {
    ActionScope,
    CreateActionInput,
    ExecuteActionInput,
    ListActionsInput,
    ListRunsInput,
    PatchActionInput,
    UpdateActionInput,
} from '@/app/ports/repos/action';
import type {
    ChartScope,
    CreateChartInput,
    CreateChartResult,
    GetChartDataInput,
    ListChartsInput,
    PatchChartInput,
    PreviewChartDataInput,
    UpdateChartInput,
} from '@/app/ports/repos/chart';
import type {
    DatasetMetadata,
    DatasetRowsPage,
    DatasetScope,
    DeleteDatasetRowsInput,
    GetDatasetRowsInput,
    InsertDatasetRowInput,
    ListDatasetsInput,
    PatchDatasetColumnInput,
    PatchDatasetInput,
    UpdateDatasetRowsInput,
} from '@/app/ports/repos/dataset';
import type {
    ColumnWidths,
    SaveTableOptionsInput,
    TableOptionsScope,
} from '@/app/ports/repos/datasetTableOptions';
import type {
    CreateOrgInput,
    CreateOrgResult,
    DeleteOrgInput,
} from '@/app/ports/repos/organization';
import type { ReadOptions } from '@/app/ports/repos/readOptions';
import type {
    LoginInput,
    RegisterInput,
    RegisterResult,
} from '@/app/ports/repos/session';
import type {
    CommitMergeResult,
    MergeInput,
    MergePreviewResult,
    MergeSessionInput,
    UploadHandle,
    UploadInput,
    UploadResult,
} from '@/app/ports/repos/upload';
import type { Query } from '@/app/queries/query';

import type { UiState } from './uiState';

export interface SessionController {
    subscribe(listener: () => void): () => void;
    snapshot(): number;
    canRead: boolean;
    setNavigator(navigate: (path: string) => void): void;
    reset(): Promise<void>;
    logout(): Promise<void>;
    waitForWorkspace(signal?: AbortSignal): Promise<void>;
}

export interface Dependencies {
    listActions: Query<ListActionsInput, Action[]>;
    getAction: Query<ActionScope, Action>;
    listActionRuns: Query<ListRunsInput, ActionRun[]>;
    createAction: Command<CreateActionInput, { id: string }>;
    updateAction: Command<UpdateActionInput, void>;
    patchAction: Command<PatchActionInput, void>;
    archiveAction: Command<ActionScope, void>;
    executeAction: Command<ExecuteActionInput, ActionRun>;

    listCharts: Query<ListChartsInput, Chart[]>;
    getChart: Query<ChartScope, Chart>;
    getChartData: Query<GetChartDataInput, ChartData>;
    previewChartData: Query<PreviewChartDataInput, ChartData>;
    createChart: Command<CreateChartInput, CreateChartResult>;
    updateChart: Command<UpdateChartInput, void>;
    patchChart: Command<PatchChartInput, void>;
    deleteChart: Command<ChartScope, void>;

    uploads: {
        register(files: readonly File[]): UploadHandle[];
        release(handles: readonly UploadHandle[]): void;
    };
    uploadDataset: Command<UploadInput, UploadResult>;
    previewDatasetMerge: Command<MergeInput, MergePreviewResult>;
    commitDatasetMerge: Command<MergeSessionInput, CommitMergeResult>;
    cancelDatasetMerge: Command<MergeSessionInput, void>;
    getDatasetTableOptions: Query<TableOptionsScope, ColumnWidths>;
    saveDatasetTableOptions: Command<SaveTableOptionsInput, void>;
    removeDatasetTableOptions: Command<TableOptionsScope, void>;
    cache: {
        read<I, O>(query: Query<I, O>, input: I, options?: ReadOptions): Promise<O>;
    };
    listDatasets: Query<ListDatasetsInput, DatasetMetadata[]>;
    getDatasetMetadata: Query<DatasetScope, DatasetMetadata>;
    getDatasetRows: Query<GetDatasetRowsInput, DatasetRowsPage>;
    deleteDataset: Command<DatasetScope, void>;
    patchDataset: Command<PatchDatasetInput, void>;
    patchDatasetColumn: Command<PatchDatasetColumnInput, DatasetColumn>;
    updateDatasetRows: Command<UpdateDatasetRowsInput, DatasetRow[]>;
    insertDatasetRow: Command<InsertDatasetRowInput, DatasetRow>;
    deleteDatasetRows: Command<DeleteDatasetRowsInput, DatasetRow[]>;
    ui: UiState;
    getSession: Query<void, Session>;
    register: Command<RegisterInput, RegisterResult>;
    login: Command<LoginInput, void>;
    logout: Command<void, void>;
    createOrganization: Command<CreateOrgInput, CreateOrgResult>;
    deleteOrganization: Command<DeleteOrgInput, void>;
    session: SessionController;
}

export const dependenciesContext = createContext<Dependencies | null>(null);

export function useDependencies(): Dependencies {
    const dependencies = useContext(dependenciesContext);
    if (!dependencies) {
        throw new Error('Dependencies provider is required');
    }

    return dependencies;
}
