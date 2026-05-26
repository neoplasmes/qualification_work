import type {
    ActionEffect,
    ActionParameter,
    ActionParameterType,
    ActionRunChange,
    ActionRunStatus,
    Action as SharedAction,
    ActionRun as SharedActionRun,
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
