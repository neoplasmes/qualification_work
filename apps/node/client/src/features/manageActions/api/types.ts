import type { ActionEffect, ActionParameter } from '@/entities/action';

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
