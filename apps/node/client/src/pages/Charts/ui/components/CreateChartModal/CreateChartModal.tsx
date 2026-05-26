import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import {
    EmptyState,
    FilterChip,
    Modal,
    SelectableList,
    StatusMessage,
} from '@/shared/ui';

import { chartsTestIds } from '../../../const';

type CreateChartModalProps = {
    datasets: DatasetMetadata[] | undefined;
    onSelect: (dataset: DatasetMetadata) => void;
    onClose: () => void;
};

export const CreateChartModal = ({
    datasets,
    onSelect,
    onClose,
}: CreateChartModalProps) => (
    <Modal
        title="Select dataset"
        ariaLabel="Select dataset"
        testId={chartsTestIds.createChartModal}
        closeButtonTestId={chartsTestIds.modalCloseButton}
        onClose={onClose}
    >
        <SelectableList>
            {!datasets && <StatusMessage centered>Loading...</StatusMessage>}
            {datasets?.length === 0 && (
                <EmptyState>No datasets. Upload one first.</EmptyState>
            )}
            {datasets?.map(item => (
                <FilterChip
                    key={item.dataset.id}
                    data-test-id={chartsTestIds.modalDatasetItem}
                    label={item.dataset.name}
                    meta={
                        <>
                            <span>{item.totalRows} rows</span>
                            <span>{item.columns.length} columns</span>
                            <span>{formatDate(item.dataset.createdAt)}</span>
                        </>
                    }
                    onClick={() => onSelect(item)}
                />
            ))}
        </SelectableList>
    </Modal>
);
