import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadDatasetModal } from './UploadDatasetModal';

const uploadDataset = vi.fn();
const mergePreview = vi.fn();
const mergeCommit = vi.fn();
const mergeCancel = vi.fn();

vi.mock('@/features/uploadDataset', () => ({
    useMergeCancelMutation: () => [mergeCancel],
    useMergeCommitMutation: () => [mergeCommit, { isLoading: false }],
    useMergePreviewMutation: () => [mergePreview, { isLoading: false }],
    useUploadDatasetMutation: () => [uploadDataset, { isLoading: false }],
}));

const csvFile = new File(['a,b\n1,2'], 'sales.csv', { type: 'text/csv' });
const xlsxFile = new File(['xlsx'], 'purchases.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const textFile = new File(['nope'], 'notes.txt', { type: 'text/plain' });

describe('UploadDatasetModal', () => {
    beforeEach(() => {
        uploadDataset.mockReset();
        mergePreview.mockReset();
        mergeCommit.mockReset();
        mergeCancel.mockReset();
        uploadDataset.mockImplementation(({ file }: { file: File }) => ({
            unwrap: () => Promise.resolve({ id: `${file.name}-id` }),
        }));
        mergePreview.mockImplementation(() => ({
            unwrap: () => Promise.resolve({ sessionId: 'session-1' }),
        }));
        mergeCommit.mockImplementation(() => ({
            unwrap: () => Promise.resolve({ datasetId: 'single-dataset-id' }),
        }));
    });

    it('shows selected files as removable chips', async () => {
        const user = userEvent.setup();
        render(
            <UploadDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                onUploadSuccess={vi.fn()}
                onClose={vi.fn()}
            />
        );

        await user.upload(screen.getByLabelText('Dataset file'), [
            csvFile,
            xlsxFile,
            textFile,
        ]);

        expect(screen.getByText('sales.csv')).toBeVisible();
        expect(screen.getByText('purchases.xlsx')).toBeVisible();
        expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
        await user.click(screen.getByLabelText('Remove sales.csv'));

        expect(screen.queryByText('sales.csv')).not.toBeInTheDocument();
        expect(screen.getByText('purchases.xlsx')).toBeVisible();
    });

    it('uploads every selected file and selects the last dataset', async () => {
        const user = userEvent.setup();
        const onUploadSuccess = vi.fn();
        const onClose = vi.fn();
        render(
            <UploadDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                onUploadSuccess={onUploadSuccess}
                onClose={onClose}
            />
        );

        await user.upload(screen.getByLabelText('Dataset file'), [csvFile, xlsxFile]);
        await user.click(screen.getByRole('button', { name: /Upload datasets/ }));

        await waitFor(() => expect(uploadDataset).toHaveBeenCalledTimes(2));
        expect(uploadDataset).toHaveBeenNthCalledWith(1, {
            orgId: 'org-1',
            file: csvFile,
        });
        expect(uploadDataset).toHaveBeenNthCalledWith(2, {
            orgId: 'org-1',
            file: xlsxFile,
        });
        expect(onUploadSuccess).toHaveBeenCalledWith('purchases.xlsx-id');
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('creates one dataset from many selected files in single mode', async () => {
        const user = userEvent.setup();
        const onUploadSuccess = vi.fn();
        const onClose = vi.fn();
        render(
            <UploadDatasetModal
                org={{ id: 'org-1', name: 'Org' }}
                onUploadSuccess={onUploadSuccess}
                onClose={onClose}
            />
        );

        await user.upload(screen.getByLabelText('Dataset file'), [csvFile, xlsxFile]);
        await user.click(screen.getByRole('button', { name: 'One dataset' }));
        await user.type(screen.getByPlaceholderText('sales'), 'Combined');
        await user.click(screen.getByRole('button', { name: /Create one dataset/ }));

        await waitFor(() => expect(mergePreview).toHaveBeenCalledTimes(1));
        expect(mergePreview).toHaveBeenCalledWith({
            orgId: 'org-1',
            name: 'Combined',
            mode: 'append',
            createNew: true,
            mergeKeys: [],
            files: [csvFile, xlsxFile],
        });
        expect(mergeCommit).toHaveBeenCalledWith({
            sessionId: 'session-1',
            orgId: 'org-1',
        });
        expect(uploadDataset).not.toHaveBeenCalled();
        expect(onUploadSuccess).toHaveBeenCalledWith('single-dataset-id');
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
