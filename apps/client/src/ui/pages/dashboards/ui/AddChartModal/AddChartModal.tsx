import type { Chart } from '@/core/entities/chart';
import { chartKindIcons } from '@/ui/widgets/ChartShell';
import {
    Button,
    Divider,
    Field,
    IconButton,
    Select,
} from '@qualification-work/design-system';
import { Eraser, Plus, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { EmptyState, Modal, StatusMessage, WorkspaceLeftPanelItem } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';

import styles from './AddChartModal.module.css';

const allDatasetsValue = '';
const chartIconSize = 18;

type AddChartModalProps = {
    charts: Chart[] | undefined;
    datasets: DatasetMetadata[] | undefined;
    selectedChartIds: string[];
    disabled: boolean;
    error?: string;
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
    error,
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
        listContent = <EmptyState>Загружаем графики…</EmptyState>;
    } else if (filteredCharts.length === 0) {
        listContent = <EmptyState>Для этой таблицы пока нет графиков.</EmptyState>;
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
                        datasetNameById.get(chart.datasetId) ?? 'Неизвестная таблица',
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
            <span className={styles['empty-selection']}>Графики не выбраны</span>
        );
    } else {
        selectedChartsContent = selectedCharts.map(chart => (
            <span key={chart.id} className={styles['chart-chip']}>
                <span className={styles['chart-name']}>{chart.name}</span>
                <button
                    type="button"
                    className={styles['remove-chart']}
                    aria-label={`Удалить ${chart.name}`}
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
                aria-label="Выбранные графики"
            >
                {selectedChartsContent}
            </div>
            <Divider />
            <Button
                className={styles['add-button']}
                data-test-id={dashboardsTestIds.addChartButton}
                disabled={selectedChartIds.length === 0 || disabled}
                aria-busy={disabled}
                onClick={onAdd}
            >
                <Plus size={18} />
                Добавить на дашборд
            </Button>
        </div>
    );

    return (
        <Modal
            title="Новый график"
            testId={dashboardsTestIds.addChartModal}
            size="md"
            padding="md"
            height={620}
            footer={footer}
            onClose={onClose}
        >
            <div className={styles['form']} data-stack="v" data-gap="md">
                {error && <StatusMessage tone="error">{error}</StatusMessage>}
                <div
                    className={styles['toolbar']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="end"
                >
                    <Field data-grow label="Таблица">
                        <Select
                            data-test-id={dashboardsTestIds.addChartDatasetSelect}
                            value={datasetId}
                            disabled={disabled}
                            onChange={event => setDatasetId(event.target.value)}
                        >
                            <option value={allDatasetsValue}>Все</option>
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
                        aria-label="Очистить выбор графиков"
                        title="Очистить выбор графиков"
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
                    aria-label="Сохранённые графики"
                >
                    {listContent}
                </div>
            </div>
        </Modal>
    );
};
