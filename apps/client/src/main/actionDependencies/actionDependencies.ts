import {
    actionCodec,
    actionListCodec,
    actionRunCodec,
    actionRunListCodec,
    valueCodec,
} from '@/env/cache/normalize';
import type { CacheRuntime } from '@/env/cache/runtime';
import { HttpActionRepo } from '@/env/repos/action';
import type { HttpTransport } from '@/env/transport/http';

import { createArchiveAction } from '@/app/commands/archiveAction';
import { createCreateAction } from '@/app/commands/createAction';
import { createExecuteAction } from '@/app/commands/executeAction';
import { createPatchAction } from '@/app/commands/patchAction';
import { createUpdateAction } from '@/app/commands/updateAction';
import type {
    CreateActionInput,
    ExecuteActionInput,
    ListRunsInput,
} from '@/app/ports/repos/action';
import { createGetAction } from '@/app/queries/getAction';
import { createListActionRuns } from '@/app/queries/listActionRuns';
import { createListActions } from '@/app/queries/listActions';

import type { createCacheBridge } from '../cacheBridge';

export function createActionDependencies(
    cache: CacheRuntime,
    transport: HttpTransport,
    legacy?: Pick<ReturnType<typeof createCacheBridge>, 'invalidate'>
) {
    const repo = new HttpActionRepo(transport);
    const execute = repo.executeAction.bind(repo);
    repo.executeAction = async input => {
        const epoch = cache.epoch;
        try {
            return await execute(input);
        } catch (error) {
            try {
                legacy?.invalidate({ refs: ['dashboard'], epoch });
            } catch (syncError) {
                console.error('Legacy dashboard synchronization failed', syncError);
            }

            throw error;
        }
    };
    const operations = {
        listActions: createListActions(repo),
        getAction: createGetAction(repo),
        listActionRuns: createListActionRuns(repo),
        createAction: createCreateAction(repo),
        updateAction: createUpdateAction(repo),
        patchAction: createPatchAction(repo),
        archiveAction: createArchiveAction(repo),
        executeAction: createExecuteAction(repo),
    };
    cache.registerRead(operations.listActions, actionListCodec);
    cache.registerRead(operations.getAction, actionCodec);
    cache.registerRead(operations.listActionRuns, actionRunListCodec, {
        normalizeInput: (input: ListRunsInput) => ({
            ...input,
            offset: input.offset ?? 0,
            limit: input.limit ?? 50,
        }),
    });
    cache.registerCommand(operations.createAction, {
        conflictKey: (input: CreateActionInput) => `action:${input.orgId}/new`,
        affected: () => ['action'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.updateAction, {
        conflictKey: input => `action:${input.orgId}/${input.actionId}`,
        affected: input => operations.updateAction.writes(input, undefined),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.patchAction, {
        conflictKey: input => `action:${input.orgId}/${input.actionId}`,
        affected: input => operations.patchAction.writes(input, undefined),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.archiveAction, {
        conflictKey: input => `action:${input.orgId}/${input.actionId}`,
        affected: input => operations.archiveAction.writes(input, undefined),
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.executeAction, {
        conflictKey: (input: ExecuteActionInput) => `orgData:${input.orgId}`,
        affected: () => [
            'actionRun',
            'dataset',
            'datasetRow',
            'datasetColumn',
            'chartData',
            'metricPreview',
            'dashboard',
        ],
        codec: actionRunCodec,
        removals: () => [],
    });

    return operations;
}
