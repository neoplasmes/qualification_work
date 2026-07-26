import type { Action } from '@/core/entities/action';
import type { ActionRun } from '@/core/entities/actionRun';
import { parseResponse } from '@/env/tools/responseSchema';
import { ContractViolationError, type HttpTransport } from '@/env/transport/http';
import { z } from 'zod';

import type {
    ActionRepo,
    ActionScope,
    CreateActionInput,
    ExecuteActionInput,
    ListActionsInput,
    ListRunsInput,
    PatchActionInput,
    UpdateActionInput,
} from '@/app/ports/repos/action';
import type { ReadOptions } from '@/app/ports/repos/readOptions';

import { actionRunSchema, actionSchema } from './action.schema';

export class HttpActionRepo implements ActionRepo {
    constructor(private readonly transport: HttpTransport) {}
    async listActions(input: ListActionsInput, options?: ReadOptions): Promise<Action[]> {
        const rows = parseResponse(
            z.array(actionSchema),
            await this.transport.request({
                path: `/data/actions?orgId=${encodeURIComponent(input.orgId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );
        if (rows.some(row => row.orgId !== input.orgId)) {
            throw new ContractViolationError('Unexpected action scope');
        }

        return rows.map(row => ({
            ...row,
            ref: `action:${encodeURIComponent(row.orgId)}/${encodeURIComponent(row.id)}`,
        }));
    }
    async getAction(input: ActionScope, options?: ReadOptions): Promise<Action> {
        const row = parseResponse(
            actionSchema,
            await this.transport.request({
                path: `/data/actions/${encodeURIComponent(input.actionId)}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );
        if (row.orgId !== input.orgId || row.id !== input.actionId) {
            throw new ContractViolationError('Unexpected action scope');
        }

        return {
            ...row,
            ref: `action:${encodeURIComponent(row.orgId)}/${encodeURIComponent(row.id)}`,
        };
    }
    async listActionRuns(
        input: ListRunsInput,
        options?: ReadOptions
    ): Promise<ActionRun[]> {
        const path =
            input.kind === 'action'
                ? `/data/actions/${encodeURIComponent(input.actionId)}/runs`
                : '/data/actions/runs';
        const params = new URLSearchParams({
            orgId: input.orgId,
            offset: String(input.offset ?? 0),
            limit: String(input.limit ?? 50),
        });
        const rows = parseResponse(
            z.array(actionRunSchema),
            await this.transport.request({
                path: `${path}?${params}`,
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );
        if (
            rows.some(
                row =>
                    row.orgId !== input.orgId ||
                    (input.kind === 'action' && row.actionId !== input.actionId)
            )
        ) {
            throw new ContractViolationError('Unexpected action run scope');
        }

        return rows.map(row => ({
            ...row,
            ref: `actionRun:${encodeURIComponent(row.orgId)}/${encodeURIComponent(row.id)}`,
        }));
    }
    async createAction(input: CreateActionInput): Promise<{ id: string }> {
        return parseResponse(
            z.object({ id: z.string() }),
            await this.transport.request({
                path: '/data/actions',
                method: 'POST',
                body: input,
                responseType: 'json',
            })
        );
    }
    async updateAction(input: UpdateActionInput): Promise<void> {
        const { orgId: _orgId, actionId, ...body } = input;
        await this.transport.request({
            path: `/data/actions/${encodeURIComponent(actionId)}`,
            method: 'PUT',
            body,
            responseType: 'text',
        });
    }
    async patchAction(input: PatchActionInput): Promise<void> {
        const { orgId: _orgId, actionId, ...body } = input;
        await this.transport.request({
            path: `/data/actions/${encodeURIComponent(actionId)}`,
            method: 'PATCH',
            body,
            responseType: 'text',
        });
    }
    async archiveAction(input: ActionScope): Promise<void> {
        await this.transport.request({
            path: `/data/actions/${encodeURIComponent(input.actionId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }
    async executeAction(input: ExecuteActionInput): Promise<ActionRun> {
        const row = parseResponse(
            actionRunSchema,
            await this.transport.request({
                path: `/data/actions/${encodeURIComponent(input.actionId)}/runs`,
                method: 'POST',
                body: { parameters: input.parameters },
                responseType: 'json',
            })
        );
        if (row.orgId !== input.orgId || row.actionId !== input.actionId) {
            throw new ContractViolationError('Unexpected action run scope');
        }

        return {
            ...row,
            ref: `actionRun:${encodeURIComponent(row.orgId)}/${encodeURIComponent(row.id)}`,
        };
    }
}
