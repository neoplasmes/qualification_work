import type {
    MergeInput,
    MergePreviewResult,
    UploadRepo,
} from '@/app/ports/repos/upload';

import type { Command } from '../command';

export function createPreviewDatasetMerge(
    repo: UploadRepo
): Command<MergeInput, MergePreviewResult> {
    return { execute: input => repo.previewDatasetMerge(input), writes: () => [] };
}
