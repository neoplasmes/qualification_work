export type ActionParameterType = 'string' | 'number' | 'date' | 'bool';

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

export type Action = {
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

export type ActionRunStatus = 'success' | 'failed';

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

export type ActionRun = {
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
