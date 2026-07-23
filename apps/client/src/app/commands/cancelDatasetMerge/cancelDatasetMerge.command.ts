import type { MergeSessionInput, UploadRepo } from '@/app/ports/repos/upload';

import type { Command } from '../command';

export function createCancelDatasetMerge(
    repo: UploadRepo
): Command<MergeSessionInput, void> {
    return { execute: input => repo.cancelDatasetMerge(input), writes: () => [] };
}
