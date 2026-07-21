import { Button } from '@qualification-work/design-system';
import { Save } from 'lucide-react';
import { useLayoutEffect } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { MetricBuilder } from '@/widgets/MetricBuilder';

import type { Dashboard, DashboardMetricItem } from '@/entities/dashboard';

import { Modal } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';
import { useDashboardMetricModal } from './model';

type Refetch = () => Promise<unknown> | unknown;

type DashboardMetricModalProps = {
    dashboard: Dashboard;
    datasets: DatasetMetadata[] | undefined;
    item: DashboardMetricItem | null;
    refetchDashboard: Refetch;
    refetchDashboards: Refetch;
    onClose: () => void;
};

const dashboardMetricFormId = 'dashboard-metric-form';

export const DashboardMetricModal = ({
    dashboard,
    datasets,
    item,
    refetchDashboard,
    refetchDashboards,
    onClose,
}: DashboardMetricModalProps) => {
    const metricModal = useDashboardMetricModal({
        dashboard,
        datasets,
        refetchDashboard,
        refetchDashboards,
    });
    const isSaveDisabled =
        !metricModal.value.datasetId ||
        !metricModal.value.expression.trim() ||
        metricModal.disabled;
    const modalTitle = item ? 'Edit metric' : 'Add metric';
    const modalActions = (
        <Button
            type="submit"
            form={dashboardMetricFormId}
            data-px="sm"
            data-py="xs"
            data-pr="none"
            data-test-id={dashboardsTestIds.addMetricButton}
            disabled={isSaveDisabled || metricModal.disabled}
            aria-busy={metricModal.disabled}
        >
            <Save size={18} />
            Save
        </Button>
    );

    useLayoutEffect(() => {
        if (item) {
            metricModal.openEdit(item);

            return;
        }

        metricModal.openAdd();
    }, [item, metricModal.openAdd, metricModal.openEdit]);

    const handleClose = () => {
        metricModal.close();
        onClose();
    };

    return (
        <Modal
            title={modalTitle}
            actions={modalActions}
            testId={dashboardsTestIds.addMetricModal}
            size="md"
            padding="md"
            height={720}
            onClose={handleClose}
        >
            <MetricBuilder
                formId={dashboardMetricFormId}
                datasets={datasets}
                value={metricModal.value}
                error={metricModal.error}
                editing={metricModal.editing}
                onChange={metricModal.setValue}
                onOutputChange={metricModal.setOutput}
                onSubmit={event => {
                    void metricModal.submit(event).then(saved => {
                        if (saved) {
                            onClose();
                        }
                    });
                }}
            />
        </Modal>
    );
};
