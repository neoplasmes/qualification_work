import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import { useChartsPageActions, useChartsPageState } from '@/ui/pages/charts/model';
import { useActiveOrganization, useSession } from '@/ui/session';
import { Button } from '@qualification-work/design-system';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { formatDate } from '@/shared/lib/formatDate';
import { EditableText, StatusMessage, Table } from '@/shared/ui';

import { chartsTestIds } from '../../const';
import { chartsWorkspaceIndexPath } from '../../lib';

import styles from './ChartsPropertiesPanel.module.css';

export const ChartsPropertiesPanel = () => {
    const { selectChart } = useChartsPageActions();
    const navigate = useNavigate();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const meQuery = useSession();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const patchChart = useCommand(dependencies.patchChart);
    const deleteChart = useCommand(dependencies.deleteChart);
    const selectedChartId = useChartsPageState(state => state.selectedChartId);
    const selectedChartQuery = useRead(
        dependencies.getChart,
        { orgId: org?.id ?? '', chartId: selectedChartId ?? '' },
        { enabled: Boolean(org?.id && selectedChartId) }
    );
    const selectedChart = selectedChartQuery.data ?? null;
    const selectedDatasetName = useMemo(
        () =>
            selectedChart
                ? (datasetsQuery.data?.find(
                      item => item.dataset.id === selectedChart.datasetId
                  )?.dataset.name ?? 'Неизвестная таблица')
                : '',
        [datasetsQuery.data, selectedChart]
    );

    const handleDelete = async () => {
        if (!selectedChart) {
            return;
        }

        if (deleteConfirmationId !== selectedChart.id) {
            setDeleteConfirmationId(selectedChart.id);

            return;
        }

        try {
            const outcome = await deleteChart.executeOutcome({
                orgId: selectedChart.orgId,
                chartId: selectedChart.id,
            });
            if (outcome.syncError) {
                setError(
                    'График удалён, но обновить список не удалось. Перезагрузите страницу.'
                );
            }
            selectChart(null);
            navigate(chartsWorkspaceIndexPath, { replace: true });
            setDeleteConfirmationId(null);
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Не удалось удалить график.'));
        }
    };

    const handleRenameChart = async (name: string) => {
        // editor only renders when a chart is selected; bail loudly if invariant breaks
        // (silent return would leave the editor showing the new name while server keeps old)
        if (!selectedChart) {
            throw new Error('Выберите график для переименования.');
        }

        try {
            setError('');
            const outcome = await patchChart.executeOutcome({
                orgId: selectedChart.orgId,
                chartId: selectedChart.id,
                name,
            });
            if (outcome.syncError) {
                setError(
                    'Название сохранено, но обновить данные не удалось. Перезагрузите страницу.'
                );
            }
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Не удалось переименовать график.'
            );
            setError(message);

            throw new Error(message);
        }
    };

    if (!selectedChart) {
        if (error) {
            return <StatusMessage tone="error">{error}</StatusMessage>;
        }
        if (selectedChartId && selectedChartQuery.isPending) {
            return <StatusMessage>Загружаем свойства графика…</StatusMessage>;
        }

        if (selectedChartId && Boolean(selectedChartQuery.error)) {
            return (
                <StatusMessage tone="error">
                    Не удалось загрузить свойства графика.
                </StatusMessage>
            );
        }

        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Выберите график, чтобы увидеть свойства.
            </p>
        );
    }

    return (
        <section data-stack="v" data-gap="md" aria-label="Свойства графика">
            <EditableText
                title={selectedChart.name}
                fallbackTitle="График без названия"
                saving={patchChart.isPending}
                editButtonTestId={chartsTestIds.renameButton}
                inputTestId={chartsTestIds.renameInput}
                onRename={handleRenameChart}
            />

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <Table
                aria-label="Свойства графика"
                headers={{ key: 'Свойство', value: 'Значение' }}
                rows={[
                    {
                        key: 'Тип',
                        value: {
                            bar: 'Столбцы',
                            line: 'Линия',
                            pie: 'Круговая диаграмма',
                            heatmap: 'Тепловая карта',
                        }[selectedChart.chartType],
                    },
                    { key: 'Таблица', value: selectedDatasetName },
                    { key: 'Создан', value: formatDate(selectedChart.createdAt) },
                    { key: 'Обновлён', value: formatDate(selectedChart.updatedAt) },
                ]}
            />

            <Button
                variant="danger"
                disabled={deleteChart.isPending}
                onClick={() => void handleDelete()}
            >
                <Trash2 size={18} />
                {deleteConfirmationId === selectedChart.id
                    ? 'Подтвердить удаление'
                    : 'Удалить график'}
            </Button>
        </section>
    );
};
