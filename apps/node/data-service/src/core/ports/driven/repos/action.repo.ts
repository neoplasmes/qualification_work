import type {
    Action,
    ActionEffect,
    ActionParameter,
    ActionRun,
    ActionRunChange,
    DatasetColumn,
} from '@/core/domain';

export type CreateActionPayload = {
    orgId: string;
    name: string;
    description: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
};

export type UpdateActionPayload = {
    name: string;
    description: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
};

export type PatchActionPayload = Partial<UpdateActionPayload>;

export type ListActionRunsPayload =
    | {
          kind: 'action';
          actionId: string;
          orgId: string;
          offset: number;
          limit: number;
      }
    | {
          kind: 'org';
          orgId: string;
          offset: number;
          limit: number;
      };

export type DatasetActionContext = {
    datasetId: string;
    orgId: string;
    columns: DatasetColumn[];
};

export type ResolvedActionExecutionEffect =
    | {
          kind: 'insertRow';
          datasetId: string;
          values: Record<string, unknown>;
      }
    | {
          kind: 'updateRowsByMatch';
          datasetId: string;
          match: {
              columnKey: string;
              value: unknown;
          };
          values: Record<string, unknown>;
          maxRows: number;
      };

export type ExecuteActionPayload = {
    actionId: string;
    orgId: string;
    userId: string;
    parameters: Record<string, unknown>;
    effects: ResolvedActionExecutionEffect[];
};

export type CreateFailedRunPayload = {
    actionId: string;
    orgId: string;
    userId: string;
    parameters: Record<string, unknown>;
    errorMessage: string;
};

export interface ActionRepo {
    create(data: CreateActionPayload): Promise<{ id: string }>;
    update(actionId: string, data: UpdateActionPayload): Promise<void>;
    archive(actionId: string): Promise<void>;
    getById(
        actionId: string,
        opts?: { includeArchived?: boolean }
    ): Promise<Action | null>;
    getByOrgId(orgId: string): Promise<Action[]>;
    listRuns(data: ListActionRunsPayload): Promise<ActionRun[]>;
    getDatasetContexts(datasetIds: string[]): Promise<DatasetActionContext[]>;
    executeAction(data: ExecuteActionPayload): Promise<ActionRun>;
    createFailedRun(data: CreateFailedRunPayload): Promise<ActionRun>;
}

export type { ActionRunChange };
