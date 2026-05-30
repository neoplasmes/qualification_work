import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type { ActionRunDB as ActionRun } from '@qualification-work/types';

import type { ActionRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { checkOrgMembership } from '@/shared/checkOrgMembership';

export type ListActionRunsInput =
    | {
          kind: 'action';
          actionId: string;
          orgId: string;
          offset: number;
          limit: number;
          orgs: OrgMembership[];
      }
    | {
          kind: 'org';
          orgId: string;
          offset: number;
          limit: number;
          orgs: OrgMembership[];
      };

export class ListActionRunsQuery implements Executable<
    [ListActionRunsInput],
    Promise<ActionRun[]>
> {
    constructor(private readonly actionRepo: ActionRepo) {}

    async execute(input: ListActionRunsInput): Promise<ActionRun[]> {
        checkOrgMembership(input.orgs, input.orgId);

        if (input.kind === 'action') {
            const action = await this.actionRepo.getById(input.actionId, {
                includeArchived: true,
            });
            if (!action || action.orgId !== input.orgId) {
                throw new NotFoundError('Action not found');
            }

            return this.actionRepo.listRuns({
                kind: 'action',
                actionId: input.actionId,
                orgId: input.orgId,
                offset: input.offset,
                limit: input.limit,
            });
        }

        return this.actionRepo.listRuns({
            kind: 'org',
            orgId: input.orgId,
            offset: input.offset,
            limit: input.limit,
        });
    }
}

export type ListActionRunsQueryIO = ExecutableIO<ListActionRunsQuery>;
