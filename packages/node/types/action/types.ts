import type { actionParameterTypes, actionRunStatuses } from './const.js';

export type ActionParameterType = (typeof actionParameterTypes)[number];

export type ActionParameter = {
    key: string;
    label: string;
    type: ActionParameterType;
    required?: boolean;
    defaultValue?: unknown;
};

export type ActionValueSource =
    | {
          kind: 'parameter';
          key: string;
      }
    | {
          kind: 'literal';
          value: unknown;
      };

export type ActionValuesMap = Record<string, ActionValueSource>;

export type InsertRowActionEffect = {
    kind: 'insertRow';
    datasetId: string;
    values: ActionValuesMap;
};

export type UpdateRowsByMatchActionEffect = {
    kind: 'updateRowsByMatch';
    datasetId: string;
    match: {
        columnKey: string;
        parameterKey: string;
    };
    values: ActionValuesMap;
    maxRows?: number;
};

export type ActionEffect = InsertRowActionEffect | UpdateRowsByMatchActionEffect;

export type ActionDB = {
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
};

export type ActionResponse = Omit<ActionDB, 'createdAt' | 'updatedAt' | 'archivedAt'> & {
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
};

export type ActionRunStatus = (typeof actionRunStatuses)[number];

export type ActionRunChange =
    | {
          kind: 'insertRow';
          datasetId: string;
          rowId: string;
          rowIndex: number;
          data: Record<string, unknown>;
      }
    | {
          kind: 'updateRowsByMatch';
          datasetId: string;
          match: {
              columnKey: string;
              value: unknown;
          };
          rowIds: string[];
          before: Array<{
              rowId: string;
              rowIndex: number;
              data: Record<string, unknown>;
          }>;
          after: Array<{
              rowId: string;
              rowIndex: number;
              data: Record<string, unknown>;
          }>;
      };

export type ActionRunDB = {
    id: string;
    actionId: string;
    orgId: string;
    userId: string;
    parameters: Record<string, unknown>;
    changes: ActionRunChange[];
    status: ActionRunStatus;
    errorMessage: string | null;
    executedAt: Date;
};

export type ActionRunResponse = Omit<ActionRunDB, 'executedAt'> & {
    executedAt: string;
};

export type ActionDefinitionPayload = {
    name: string;
    description?: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
};

export type CreateActionPayload = ActionDefinitionPayload & {
    orgId: string;
};

export type UpdateActionPayload = ActionDefinitionPayload;

export type PatchActionPayload = Partial<ActionDefinitionPayload>;

export type ExecuteActionPayload = {
    parameters: Record<string, unknown>;
};

export type ListActionRunsPayload =
    | {
          kind: 'action';
          actionId: string;
          orgId: string;
          offset?: number;
          limit?: number;
      }
    | {
          kind: 'org';
          orgId: string;
          offset?: number;
          limit?: number;
      };

export type Action = ActionResponse;

export type ActionRun = ActionRunResponse;
