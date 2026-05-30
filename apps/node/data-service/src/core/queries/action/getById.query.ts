import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { ActionDB as Action } from '@qualification-work/types';

import type { ActionRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetActionByIdQuery implements Executable<
    [string, OrgMembership[]],
    Promise<Action>
> {
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(actionId: string, orgs: OrgMembership[]): Promise<Action> {
        const action = await this.actionRepo.getById(actionId);

        if (!action) {
            throw new NotFoundError('Action not found');
        }

        checkOrgMembership(orgs, action.orgId);

        return action;
    }
}

export type GetActionByIdQueryIO = ExecutableIO<GetActionByIdQuery>;
