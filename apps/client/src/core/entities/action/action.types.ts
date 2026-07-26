export type ActionParameterType = 'string' | 'number' | 'bool' | 'date' | 'day_of_week';

export type ActionValueOperation = '=' | '+' | '-' | '*' | '/';

export type ActionComputedOperation = '+' | '-' | '*' | '/';

export type ActionParameter = {
    key: string;
    label: string;
    type: ActionParameterType;
    required?: boolean;
    defaultValue?: unknown;
    hidden?: boolean;
};

export type ActionValueSource =
    | {
          kind: 'parameter';
          key: string;
          operation?: ActionValueOperation;
      }
    | {
          kind: 'literal';
          value: unknown;
          operation?: ActionValueOperation;
      }
    | {
          kind: 'computed';
          leftParameterKey: string;
          operation: ActionComputedOperation;
          rightParameterKey: string;
      };

export type ActionValuesMap = Record<string, ActionValueSource>;

export type ActionMatchSource =
    | {
          kind: 'parameter';
          key: string;
      }
    | {
          kind: 'literal';
          value: unknown;
      };

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
        parameterKey?: string;
        source?: ActionMatchSource;
    };
    values: ActionValuesMap;
    maxRows?: number;
};

export type ActionEffect = InsertRowActionEffect | UpdateRowsByMatchActionEffect;

export type ActionDefinitionPayload = {
    name: string;
    description?: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
};
