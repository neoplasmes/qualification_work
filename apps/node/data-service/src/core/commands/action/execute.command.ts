import { ForbiddenError, NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { ActionEffect, ActionRunDB as ActionRun } from '@qualification-work/types';

import {
    assertEffectColumnsExist,
    coerceActionParameters,
    resolveActionValue,
    resolveAndCoerceEffectValues,
} from '@/core/domain/action';
import type {
    ActionRepo,
    DatasetActionContext,
    ResolvedActionExecutionEffect,
} from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export type ExecuteActionInput = {
    actionId: string;
    userId: string;
    orgs: OrgMembership[];
    parameters: Record<string, unknown>;
};

export class ExecuteActionCommand implements Executable<
    [ExecuteActionInput],
    Promise<ActionRun>
> {
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(input: ExecuteActionInput): Promise<ActionRun> {
        const action = await this.actionRepo.getById(input.actionId);
        if (!action) {
            throw new NotFoundError('Action not found');
        }

        checkWritableOrgMembership(input.orgs, action.orgId);

        let parametersForRun = input.parameters;

        try {
            const parameters = coerceActionParameters(
                action.parameters,
                input.parameters
            );
            parametersForRun = parameters;
            const effects = await this.resolveEffects(
                action.orgId,
                action.effects,
                parameters
            );

            return await this.actionRepo.executeAction({
                actionId: action.id,
                orgId: action.orgId,
                userId: input.userId,
                parameters,
                effects,
            });
        } catch (err) {
            await this.actionRepo.createFailedRun({
                actionId: action.id,
                orgId: action.orgId,
                userId: input.userId,
                parameters: parametersForRun,
                errorMessage: err instanceof Error ? err.message : 'Action failed',
            });

            throw err;
        }
    }

    private async resolveEffects(
        orgId: string,
        effects: ActionEffect[],
        parameters: Record<string, unknown>
    ): Promise<ResolvedActionExecutionEffect[]> {
        const datasetIds = [...new Set(effects.map(effect => effect.datasetId))];
        const contexts = await this.actionRepo.getDatasetContexts(datasetIds);
        const contextByDatasetId = new Map(
            contexts.map(context => [context.datasetId, context])
        );
        const resolved: ResolvedActionExecutionEffect[] = [];

        for (const effect of effects) {
            const context = contextByDatasetId.get(effect.datasetId);
            this.assertDatasetContext(orgId, effect.datasetId, context);
            assertEffectColumnsExist(effect, context.columns);

            if (effect.kind === 'insertRow') {
                resolved.push({
                    kind: 'insertRow',
                    datasetId: effect.datasetId,
                    values: resolveAndCoerceEffectValues(
                        effect,
                        context.columns,
                        parameters,
                        true
                    ),
                });

                continue;
            }

            const matchColumn = context.columns.find(
                column => column.key === effect.match.columnKey
            );
            if (!matchColumn) {
                throw new NotFoundError('Match column not found');
            }

            const rawMatchValue = resolveActionValue(
                { kind: 'parameter', key: effect.match.parameterKey },
                parameters
            );

            resolved.push({
                kind: 'updateRowsByMatch',
                datasetId: effect.datasetId,
                match: {
                    columnKey: effect.match.columnKey,
                    value: rawMatchValue,
                },
                values: resolveAndCoerceEffectValues(
                    effect,
                    context.columns,
                    parameters,
                    false
                ),
                maxRows: effect.maxRows ?? 1,
            });
        }

        return resolved;
    }

    private assertDatasetContext(
        orgId: string,
        datasetId: string,
        context: DatasetActionContext | undefined
    ): asserts context is DatasetActionContext {
        if (!context) {
            throw new NotFoundError(`Dataset ${datasetId} not found`);
        }

        if (context.orgId !== orgId) {
            throw new ForbiddenError(
                `Dataset ${datasetId} belongs to another organization`
            );
        }
    }
}

export type ExecuteActionCommandIO = ExecutableIO<ExecuteActionCommand>;
