import type { ActionRun } from '@/entities/action';
import type { DatasetMetadata } from '@/entities/dataset';

export const canMutate = (role: string | undefined) =>
    role === 'owner' || role === 'editor';

export const getDatasetColumns = (
    datasets: DatasetMetadata[] | undefined,
    datasetId: string
) => datasets?.find(item => item.dataset.id === datasetId)?.columns ?? [];

export const moveItem = <T>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
        return items;
    }

    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);

    return next;
};

export const summarizeRun = (run: ActionRun) => {
    if (run.status === 'failed') {
        return run.errorMessage ?? 'Run failed.';
    }

    if (run.changes.length === 0) {
        return 'No changes recorded.';
    }

    return `${run.changes.length} changes`;
};
