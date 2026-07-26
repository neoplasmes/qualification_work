import type { Action, ActionDefinitionPayload } from '@/core/entities/action';
import type { ActionRun } from '@/core/entities/actionRun';

import type { ReadOptions } from '../readOptions';

export type ListActionsInput = { orgId: string };
export type ActionScope = ListActionsInput & { actionId: string };
export type ListRunsInput = (
    | { kind: 'org'; orgId: string }
    | { kind: 'action'; orgId: string; actionId: string }
) & { offset?: number; limit?: number };
export type CreateActionInput = ListActionsInput & ActionDefinitionPayload;
export type UpdateActionInput = ActionScope & ActionDefinitionPayload;
export type PatchActionInput = ActionScope & Partial<ActionDefinitionPayload>;
export type ExecuteActionInput = ActionScope & { parameters: Record<string, unknown> };
export interface ActionRepo {
    listActions(input: ListActionsInput, options?: ReadOptions): Promise<Action[]>;
    getAction(input: ActionScope, options?: ReadOptions): Promise<Action>;
    listActionRuns(input: ListRunsInput, options?: ReadOptions): Promise<ActionRun[]>;
    createAction(input: CreateActionInput): Promise<{ id: string }>;
    updateAction(input: UpdateActionInput): Promise<void>;
    patchAction(input: PatchActionInput): Promise<void>;
    archiveAction(input: ActionScope): Promise<void>;
    executeAction(input: ExecuteActionInput): Promise<ActionRun>;
}
