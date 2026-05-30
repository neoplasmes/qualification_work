import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';

import type { ActionRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkWritableOrgMembership } from '@/shared/checkOrgMembership';

export class ArchiveActionCommand implements Executable<
    [string, OrgMembership[]],
    Promise<void>
> {
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(actionId: string, orgs: OrgMembership[]): Promise<void> {
        const action = await this.actionRepo.getById(actionId);
        if (!action) {
            throw new NotFoundError('Action not found');
        }

        checkWritableOrgMembership(orgs, action.orgId);

        await this.actionRepo.archive(actionId);
    }
}

export type ArchiveActionCommandIO = ExecutableIO<ArchiveActionCommand>;
