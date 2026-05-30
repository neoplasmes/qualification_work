import { ForbiddenError, NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import { validateActionDefinition } from '@/core/domain/action';
import type { ActionRepo, UpdateActionPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export class UpdateActionCommand implements Executable<
    [string, UpdateActionPayload, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(
        actionId: string,
        payload: UpdateActionPayload,
        orgs: OrgMembership[]
    ): Promise<void> {
        const action = await this.actionRepo.getById(actionId);
        if (!action) {
            throw new NotFoundError('Action not found');
        }

        checkWritableOrgMembership(orgs, action.orgId);
        validateActionDefinition(payload.parameters, payload.effects);
        await this.validateDatasetReferences(action.orgId, payload);

        await this.actionRepo.update(actionId, payload);
    }

    private async validateDatasetReferences(
        orgId: string,
        payload: UpdateActionPayload
    ): Promise<void> {
        const datasetIds = [...new Set(payload.effects.map(effect => effect.datasetId))];
        const contexts = await this.actionRepo.getDatasetContexts(datasetIds);
        const contextsById = new Map(
            contexts.map(context => [context.datasetId, context])
        );

        for (const datasetId of datasetIds) {
            const context = contextsById.get(datasetId);
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
}

export type UpdateActionCommandIO = ExecutableIO<UpdateActionCommand>;
export type { UpdateActionPayload };
