import { ForbiddenError } from '@qualification-work/microservice-utils';

import type { MergeSessionRepo } from '@/core/ports/driven/repos';
import type { TmpFileStorageTool } from '@/core/ports/driven/tools';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export type CancelMergeInput = {
    sessionId: string;
    orgId: string;
};

export class CancelMergeCommand implements Executable<[CancelMergeInput], Promise<void>> {
    constructor(
        private readonly mergeSessionRepo: MergeSessionRepo,
        private readonly tmpStorage: TmpFileStorageTool
    ) {}

    async execute(input: CancelMergeInput): Promise<void> {
        const session = await this.mergeSessionRepo.get(input.sessionId);

        // idempotent - missing session means nothing to clean up
        if (!session) {
            await this.tmpStorage.deleteSession(input.sessionId);

            return;
        }

        if (session.orgId !== input.orgId) {
            throw new ForbiddenError('merge session belongs to another organization');
        }

        await Promise.all([
            this.tmpStorage.deleteSession(input.sessionId),
            this.mergeSessionRepo.delete(input.sessionId),
        ]);
    }
}

export type CancelMergeCommandIO = ExecutableIO<CancelMergeCommand>;
