import type {
    Action as SharedAction,
    ActionEffect,
    ActionParameter,
    ActionParameterType,
    ActionRun as SharedActionRun,
    ActionRunChange,
    ActionRunStatus,
} from '@qualification-work/types';

export type Action = Omit<SharedAction, 'createdAt' | 'updatedAt' | 'archivedAt'> & {
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
};

export type ActionRun = Omit<SharedActionRun, 'executedAt'> & {
    executedAt: string;
};

export type {
    ActionEffect,
    ActionParameter,
    ActionParameterType,
    ActionRunChange,
    ActionRunStatus,
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

export type PatchActionPayload = Partial<ActionDefinitionPayload> & {
    actionId: string;
};

export type UpdateActionPayload = ActionDefinitionPayload & {
    actionId: string;
};

export type ExecuteActionPayload = {
    actionId: string;
    parameters: Record<string, unknown>;
};

export type ListActionRunsPayload =
    | {
          kind: 'action';
          orgId: string;
          actionId: string;
          offset?: number;
          limit?: number;
      }
    | {
          kind: 'org';
          orgId: string;
          offset?: number;
          limit?: number;
      };
