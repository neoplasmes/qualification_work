import { Eraser } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CHART_KIND_ICONS, type Chart } from '@/entities/chart';
import type { DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import {
    EmptyState,
    FormField,
    IconButton,
    Select,
    WorkspaceLeftPanelItem,
} from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import styles from './AddChartForm.module.scss';

const allDatasetsValue = '';
const chartIconSize = 18;

type AddChartFormProps = {
    charts: Chart[] | undefined;
    datasets: DatasetMetadata[] | undefined;
    selectedChartIds: string[];
    disabled: boolean;
    onToggleChart: (chartId: string) => void;
    onClearSelection: () => void;
};

export const AddChartForm = ({
    charts,
    datasets,
    selectedChartIds,
    disabled,
    onToggleChart,
    onClearSelection,
}: AddChartFormProps) => {
    const [datasetId, setDatasetId] = useState(allDatasetsValue);
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

    let listContent;

    if (!charts) {
        listContent = <EmptyState>Loading charts...</EmptyState>;
    } else if (filteredCharts.length === 0) {
        listContent = <EmptyState>No charts for this dataset.</EmptyState>;
    } else {
        listContent = filteredCharts.map(chart => {
            const ChartIcon = CHART_KIND_ICONS[chart.chartType];

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

    return (
        <div className={styles['form']} data-stack="v" data-gap="md">
            <div data-stack="h" data-gap="sm" data-align="end">
                <FormField data-grow label="Dataset">
                    <Select
                        data-test-id={dashboardsTestIds.addChartDatasetSelect}
                        value={datasetId}
                        disabled={disabled}
                        onChange={event => setDatasetId(event.target.value)}
                    >
                        <option value={allDatasetsValue}>All</option>
                        {datasets?.map(dataset => (
                            <option key={dataset.dataset.id} value={dataset.dataset.id}>
                                {dataset.dataset.name}
                            </option>
                        ))}
                    </Select>
                </FormField>
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
    );
};
