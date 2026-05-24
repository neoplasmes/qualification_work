import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import { validateActionDefinition } from '@/core/domain/action';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import type { ActionRepo, CreateActionPayload } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export class CreateActionCommand
    implements Executable<[CreateActionPayload, OrgMembership[]], Promise<{ id: string }>>
{
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(
        payload: CreateActionPayload,
        orgs: OrgMembership[]
    ): Promise<{ id: string }> {
        checkWritableOrgMembership(orgs, payload.orgId);
        validateActionDefinition(payload.parameters, payload.effects);
        await this.validateDatasetReferences(payload);

        return this.actionRepo.create(payload);
    }

    private async validateDatasetReferences(payload: CreateActionPayload): Promise<void> {
        const datasetIds = [...new Set(payload.effects.map(effect => effect.datasetId))];
        const contexts = await this.actionRepo.getDatasetContexts(datasetIds);
        const contextsById = new Map(contexts.map(context => [context.datasetId, context]));

        for (const datasetId of datasetIds) {
            const context = contextsById.get(datasetId);
            if (!context) {
                throw new NotFoundError(`Dataset ${datasetId} not found`);
            }

            if (context.orgId !== payload.orgId) {
                throw new ForbiddenError(`Dataset ${datasetId} belongs to another organization`);
            }
        }
    }
}

export type CreateActionCommandIO = ExecutableIO<CreateActionCommand>;
export type { CreateActionPayload };
