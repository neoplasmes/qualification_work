import { datasetChanges } from '@/core/processes/datasetChanges';

import type {
    CommitMergeResult,
    MergeSessionInput,
    UploadRepo,
} from '@/app/ports/repos/upload';

import type { Command } from '../command';

export function createCommitDatasetMerge(
    repo: UploadRepo
): Command<MergeSessionInput, CommitMergeResult> {
    return {
        execute: input => repo.commitDatasetMerge(input),
        writes: (input, output) =>
            datasetChanges(
                `dataset:${encodeURIComponent(input.orgId)}/${encodeURIComponent(output.datasetId)}`,
                'content'
            ),
    };
}
