import {
    Button,
    Divider,
    Field,
    IconButton,
    Select,
} from '@qualification-work/design-system';
import type { Chart } from '@qualification-work/types';
import { Eraser, Plus, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { CHART_KIND_ICONS as chartKindIcons } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { EmptyState, Modal, WorkspaceLeftPanelItem } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';

import styles from './AddChartModal.module.css';

const allDatasetsValue = '';
const chartIconSize = 18;

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
    const [datasetId, setDatasetId] = useState(allDatasetsValue);

    const chartById = useMemo(
        () => new Map((charts ?? []).map(chart => [chart.id, chart])),
        [charts]
    );
    const selectedChartIdSet = useMemo(
        () => new Set(selectedChartIds),
        [selectedChartIds]
    );
    const datasetNameById = useMemo(
        () =>
            new Map(
                (datasets ?? []).map(dataset => [
                    dataset.dataset.id,
                    dataset.dataset.name,
                ])
            ),
        [datasets]
    );
    const filteredCharts = useMemo(() => {
        const items = charts ?? [];

        return datasetId ? items.filter(chart => chart.datasetId === datasetId) : items;
    }, [charts, datasetId]);

    const selectedCharts = selectedChartIds
        .map(chartId => chartById.get(chartId))
        .filter((chart): chart is Chart => Boolean(chart));

    let listContent;

    if (!charts) {
        listContent = <EmptyState>Loading charts...</EmptyState>;
    } else if (filteredCharts.length === 0) {
        listContent = <EmptyState>No charts for this dataset.</EmptyState>;
    } else {
        listContent = filteredCharts.map(chart => {
            const ChartIcon = chartKindIcons[chart.chartType];

            return (
                <WorkspaceLeftPanelItem
                    key={chart.id}
                    selected={selectedChartIdSet.has(chart.id)}
                    testId={dashboardsTestIds.addChartListItem}
                    header={chart.name}
                    details={[
                        formatDate(chart.createdAt),
                        datasetNameById.get(chart.datasetId) ?? 'Unknown dataset',
                    ]}
                    iconElement={<ChartIcon size={chartIconSize} />}
                    onClick={() => {
                        if (!disabled) {
                            onToggleChart(chart.id);
                        }
                    }}
                />
            );
        });
    }

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
            <Divider />
            <Button
                className={styles['add-button']}
                data-test-id={dashboardsTestIds.addChartButton}
                disabled={selectedChartIds.length === 0 || disabled || disabled}
                aria-busy={disabled}
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
            <div className={styles['form']} data-stack="v" data-gap="md">
                <div
                    className={styles['toolbar']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="end"
                >
                    <Field data-grow label="Dataset">
                        <Select
                            data-test-id={dashboardsTestIds.addChartDatasetSelect}
                            value={datasetId}
                            disabled={disabled}
                            onChange={event => setDatasetId(event.target.value)}
                        >
                            <option value={allDatasetsValue}>All</option>
                            {datasets?.map(dataset => (
                                <option
                                    key={dataset.dataset.id}
                                    value={dataset.dataset.id}
                                >
                                    {dataset.dataset.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <IconButton
                        data-test-id={dashboardsTestIds.clearAddChartSelectionButton}
                        aria-label="Clear selected charts"
                        title="Clear selected charts"
                        disabled={disabled || selectedChartIds.length === 0}
                        onClick={onClearSelection}
                    >
                        <Eraser size={18} />
                    </IconButton>
                </div>

                <div
                    className={styles['list']}
                    data-stack="v"
                    data-gap="xs"
                    aria-label="Saved charts"
                >
                    {listContent}
                </div>
            </div>
        </Modal>
    );
};
