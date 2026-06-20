import { Sheet } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { EmptyState, Modal, StatusMessage, WorkspaceLeftPanelItem } from '@/shared/ui';

import { chartsTestIds } from '../../const';

type SelectDatasetForChartModalProps = {
    datasets: DatasetMetadata[] | undefined;
    onSelect: (dataset: DatasetMetadata) => void;
    onClose: () => void;
};

export const SelectDatasetForChartModal = ({
    datasets,
    onSelect,
    onClose,
}: SelectDatasetForChartModalProps) => (
    <Modal
        title="Select dataset"
        ariaLabel="Select dataset"
        testId={chartsTestIds.createChartModal}
        closeButtonTestId={chartsTestIds.modalCloseButton}
        onClose={onClose}
    >
        <div data-stack="v" data-gap="xs">
            {!datasets && <StatusMessage centered>Loading...</StatusMessage>}
            {datasets?.length === 0 && (
                <EmptyState>No datasets. Upload one first.</EmptyState>
            )}
            {datasets?.map(item => (
                <WorkspaceLeftPanelItem
                    key={item.dataset.id}
                    testId={chartsTestIds.modalDatasetItem}
                    header={item.dataset.name}
                    details={[
                        `${item.totalRows} rows`,
                        `${item.columns.length} columns`,
                        formatDate(item.dataset.createdAt),
                    ]}
                    iconElement={<Sheet size={18} />}
                    onClick={() => onSelect(item)}
                />
            ))}
        </div>
    </Modal>
);
