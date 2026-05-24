import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import { validateActionDefinition } from '@/core/domain/action';
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors';
import type {
    ActionRepo,
    PatchActionPayload,
    UpdateActionPayload,
} from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export class PatchActionCommand
    implements Executable<[string, PatchActionPayload, OrgMembership[]], Promise<void>>
{
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(
        actionId: string,
        payload: PatchActionPayload,
        orgs: OrgMembership[]
    ): Promise<void> {
        if (Object.keys(payload).length === 0) {
            throw new ValidationError([], 'patch body is empty');
        }

        const action = await this.actionRepo.getById(actionId);
        if (!action) {
            throw new NotFoundError('Action not found');
        }

        checkWritableOrgMembership(orgs, action.orgId);

        const next: UpdateActionPayload = {
            name: payload.name ?? action.name,
            description:
                payload.description === undefined ? action.description : payload.description,
            parameters: payload.parameters ?? action.parameters,
            effects: payload.effects ?? action.effects,
        };

        validateActionDefinition(next.parameters, next.effects);
        await this.validateDatasetReferences(action.orgId, next);

        await this.actionRepo.update(actionId, next);
    }

    private async validateDatasetReferences(
        orgId: string,
        payload: UpdateActionPayload
    ): Promise<void> {
        const datasetIds = [...new Set(payload.effects.map(effect => effect.datasetId))];
        const contexts = await this.actionRepo.getDatasetContexts(datasetIds);
        const contextsById = new Map(contexts.map(context => [context.datasetId, context]));

        for (const datasetId of datasetIds) {
            const context = contextsById.get(datasetId);
            if (!context) {
                throw new NotFoundError(`Dataset ${datasetId} not found`);
            }

            if (context.orgId !== orgId) {
                throw new ForbiddenError(`Dataset ${datasetId} belongs to another organization`);
            }
        }
    }
}

export type PatchActionCommandIO = ExecutableIO<PatchActionCommand>;
export type { PatchActionPayload };
