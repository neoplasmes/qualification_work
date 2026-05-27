import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../../const';

import { MergeDatasetModal } from './MergeDatasetModal';

const mergePreview = vi.fn();
const mergeCommit = vi.fn();
const mergeCancel = vi.fn();

vi.mock('@/features/uploadDataset', () => ({
    useMergePreviewMutation: () => [mergePreview, { isLoading: false }],
    useMergeCommitMutation: () => [mergeCommit, { isLoading: false }],
    useMergeCancelMutation: () => [mergeCancel],
}));

const selectedDataset = {
    dataset: {
        id: 'dataset-1',
        orgId: 'org-1',
        name: 'Purchases',
        sourceType: 'csv' as const,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
    columns: [
        {
            id: 'c-id',
            datasetId: 'dataset-1',
            key: 'id',
            displayName: 'ID',
            dataType: 'number' as const,
            orderIndex: 0,
        },
        {
            id: 'c-name',
            datasetId: 'dataset-1',
            key: 'name',
            displayName: 'Name',
            dataType: 'string' as const,
            orderIndex: 1,
        },
    ],
    totalRows: 2,
};

const previewResult = {
    sessionId: 'session-1',
    expiresInSeconds: 1800,
    conflicts: [],
    statistics: {
        totalFiles: 1,
        totalIncomingRows: 2,
        totalNewRows: 2,
        totalDuplicateRows: 0,
        existingRowCount: 2,
        copiedRows: 0,
        newColumns: [],
        commonColumns: ['id', 'name'],
    },
};

const file = new File(['id,name\n1,Alice'], 'rows.csv', { type: 'text/csv' });

const queryByDataTestId = (container: HTMLElement, testId: string) =>
    container.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);

describe('MergeDatasetModal', () => {
    beforeEach(() => {
        mergePreview.mockReset();
        mergeCommit.mockReset();
        mergeCancel.mockReset();
        mergePreview.mockReturnValue({ unwrap: () => Promise.resolve(previewResult) });
        mergeCommit.mockReturnValue({
            unwrap: () => Promise.resolve({ datasetId: 'dataset-1' }),
        });
    });

    it('sends append mode without merge keys by default', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MergeDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                selectedDataset={selectedDataset}
                onSuccess={vi.fn()}
                onClose={vi.fn()}
            />
        );

        await user.upload(
            queryByDataTestId(
                container,
                datasetsTestIds.mergeFileInput
            ) as HTMLInputElement,
            file
        );
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(mergePreview).toHaveBeenCalledTimes(1));
        expect(mergePreview).toHaveBeenCalledWith(
            expect.objectContaining({
                datasetId: 'dataset-1',
                mode: 'append',
                createNew: false,
                mergeKeys: [],
            })
        );
    });

    it('shows merge keys only for merge mode and sends selected keys', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <MergeDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                selectedDataset={selectedDataset}
                onSuccess={vi.fn()}
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByText('Merge keys')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Merge by key' }));
        await user.click(screen.getByLabelText('ID'));
        await user.upload(
            queryByDataTestId(
                container,
                datasetsTestIds.mergeFileInput
            ) as HTMLInputElement,
            file
        );
        await user.click(screen.getByRole('button', { name: 'Preview' }));

        await waitFor(() => expect(mergePreview).toHaveBeenCalledTimes(1));
        expect(mergePreview).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: 'merge',
                mergeKeys: ['id'],
            })
        );
    });

    it('allows create-new mode with an optional name', async () => {
        const user = userEvent.setup();
        render(
            <MergeDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                selectedDataset={selectedDataset}
                onSuccess={vi.fn()}
                onClose={vi.fn()}
            />
        );

        await user.click(screen.getByLabelText(/Create new dataset/));

        expect(screen.getByText('Dataset name')).toBeInTheDocument();
    });
});
