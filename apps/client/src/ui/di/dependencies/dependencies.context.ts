import type { DatasetColumn } from '@/core/entities/datasetColumn';
import type { DatasetRow } from '@/core/entities/datasetRow';
import type { Session } from '@/core/entities/user';
import { createContext, useContext } from 'react';

import type { Command } from '@/app/commands/command';
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
