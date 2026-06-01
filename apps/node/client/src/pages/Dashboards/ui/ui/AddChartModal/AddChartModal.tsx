import { Plus, X } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import type { Chart } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { Button, Modal, Separator } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import { AddChartForm } from '../AddChartForm';

import styles from './AddChartModal.module.scss';

type AddChartModalProps = {
    charts: Chart[] | undefined;
    datasets: DatasetMetadata[] | undefined;
    selectedChartIds: string[];
    disabled: boolean;
    onToggleChart: (chartId: string) => void;
    onRemoveChart: (chartId: string) => void;
    onClearSelection: () => void;
    onAdd: () => void;
    onClose: () => void;
};

export const AddChartModal = ({
    charts,
    datasets,
    selectedChartIds,
    disabled,
    onToggleChart,
    onRemoveChart,
    onClearSelection,
    onAdd,
    onClose,
}: AddChartModalProps) => {
    const chartById = useMemo(
        () => new Map((charts ?? []).map(chart => [chart.id, chart])),
        [charts]
    );
    const selectedCharts = selectedChartIds
        .map(chartId => chartById.get(chartId))
        .filter((chart): chart is Chart => Boolean(chart));

    let selectedChartsContent: ReactNode;

    if (selectedCharts.length === 0) {
        selectedChartsContent = (
            <span className={styles['empty-selection']}>No charts selected</span>
        );
    } else {
        selectedChartsContent = selectedCharts.map(chart => (
            <span key={chart.id} className={styles['chart-chip']}>
                <span className={styles['chart-name']}>{chart.name}</span>
                <button
                    type="button"
                    className={styles['remove-chart']}
                    aria-label={`Remove ${chart.name}`}
                    disabled={disabled}
                    onClick={() => onRemoveChart(chart.id)}
                >
                    <X size={14} />
                </button>
            </span>
        ));
    }

    const footer: ReactNode = (
        <div data-stack="v" data-gap="sm">
            <div
                data-stack="h"
                data-gap="xs"
                data-wrap="wrap"
                data-align="center"
                aria-label="Selected charts"
            >
                {selectedChartsContent}
            </div>
            <Separator />
            <Button
                className={styles['add-button']}
                data-test-id={dashboardsTestIds.addChartButton}
                disabled={selectedChartIds.length === 0 || disabled}
                isLoading={disabled}
                onClick={onAdd}
            >
                <Plus size={18} />
                Add to dashboard
            </Button>
        </div>
    );

    return (
        <Modal
            title="Add chart"
            testId={dashboardsTestIds.addChartModal}
            size="md"
            padding="md"
            height={620}
            footer={footer}
            onClose={onClose}
        >
            <AddChartForm
                charts={charts}
                datasets={datasets}
                selectedChartIds={selectedChartIds}
                disabled={disabled}
                onToggleChart={onToggleChart}
                onClearSelection={onClearSelection}
            />
        </Modal>
    );
};
