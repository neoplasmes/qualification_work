import type {
    ActionDefinitionPayload,
    CreateActionPayload,
    UpdateActionPayload as UpdateActionBodyPayload,
} from '@qualification-work/types';

export type { ActionDefinitionPayload, CreateActionPayload };

export type PatchActionPayload = Partial<ActionDefinitionPayload> & {
    actionId: string;
};

export type UpdateActionPayload = UpdateActionBodyPayload & {
    actionId: string;
};

export type ExecuteActionPayload = {
    actionId: string;
    parameters: Record<string, unknown>;
};
