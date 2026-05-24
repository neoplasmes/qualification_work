import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import type { Action } from '@/core/domain';
import type { ActionRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';
import { checkOrgMembership } from '@/shared/checkOrgMembership';

export class GetActionsByOrgIdQuery
    implements Executable<[string, OrgMembership[]], Promise<Action[]>>
{
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(orgId: string, orgs: OrgMembership[]): Promise<Action[]> {
        checkOrgMembership(orgs, orgId);

        return this.actionRepo.getByOrgId(orgId);
    }
}

export type GetActionsByOrgIdQueryIO = ExecutableIO<GetActionsByOrgIdQuery>;
