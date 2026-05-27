import type { Chart } from '@/entities/chart';

import { Modal } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { AddChartForm } from '../AddChartForm';

type AddChartModalProps = {
    charts: Chart[] | undefined;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onAdd: () => void;
    onClose: () => void;
};

export const AddChartModal = ({
    charts,
    value,
    disabled,
    onChange,
    onAdd,
    onClose,
}: AddChartModalProps) => (
    <Modal
        title="Add chart"
        testId={dashboardsTestIds.addChartModal}
        size="sm"
        onClose={onClose}
    >
        <AddChartForm
            charts={charts}
            value={value}
            disabled={disabled}
            onChange={onChange}
            onAdd={onAdd}
        />
    </Modal>
);
