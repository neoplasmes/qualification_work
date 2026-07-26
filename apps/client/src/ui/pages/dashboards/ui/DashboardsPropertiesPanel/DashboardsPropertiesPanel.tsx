import { useCommand } from '@/env/cache/useCommand';
import { useDashboardsPageActions } from '@/ui/pages/dashboards/model';
import { Button } from '@qualification-work/design-system';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getApiErrorMessage } from '@/shared/api';
import { formatDate } from '@/shared/lib/formatDate';
import { EditableText, StatusMessage, Table } from '@/shared/ui';

import { dashboardsTestIds } from '../../const';
import { dashboardsWorkspaceIndexPath } from '../../lib';
import { useDashboardsController } from '../../model';

import styles from './DashboardsPropertiesPanel.module.css';

export const DashboardsPropertiesPanel = () => {
    const { selectDashboard } = useDashboardsPageActions();
    const navigate = useNavigate();
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const {
        dependencies,
        orgId,
        selectedListDashboard,
        dashboard: selectedDashboard,
    } = useDashboardsController();
    const renameState = useCommand(dependencies.renameDashboard);
    const deleteDashboardState = useCommand(dependencies.deleteDashboard);

    const handleDelete = async () => {
        if (!selectedDashboard) {
            return;
        }

        if (deleteConfirmationId !== selectedDashboard.id) {
            setDeleteConfirmationId(selectedDashboard.id);

            return;
        }

        try {
            const outcome = await deleteDashboardState.executeOutcome({
                orgId,
                dashboardId: selectedDashboard.id,
            });
            if (outcome.syncError) {
                setError(
                    'Дашборд удалён, но обновление списка не удалось. Обновите данные.'
                );
            }
            selectDashboard(null);
            navigate(dashboardsWorkspaceIndexPath, { replace: true });
            setDeleteConfirmationId(null);
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete this dashboard.'));
        }
    };

    const handleRenameDashboard = async (name: string) => {
        if (!selectedDashboard) {
            return;
        }

        try {
            setError('');
            const outcome = await renameState.executeOutcome({
                orgId,
                dashboardId: selectedDashboard.id,
                name,
            });
            if (outcome.syncError) {
                setError(
                    'Название сохранено, но обновление данных не удалось. Обновите данные.'
                );
            }
        } catch (renameError) {
            const message = getApiErrorMessage(
                renameError,
                'Unable to rename this dashboard.'
            );
            setError(message);

            throw new Error(message);
        }
    };

    const feedback = error ? (
        <StatusMessage tone="error">
            {error}
            <Button
                variant="ghost"
                onClick={() => {
                    void Promise.all([
                        dependencies.cache.read(dependencies.listDashboards, { orgId }),
                        ...(selectedDashboard
                            ? [
                                  dependencies.cache.read(dependencies.getDashboard, {
                                      orgId,
                                      dashboardId: selectedDashboard.id,
                                  }),
                              ]
                            : []),
                    ])
                        .then(() => setError(''))
                        .catch(() => {});
                }}
            >
                Обновить данные
            </Button>
        </StatusMessage>
    ) : null;

    if (!selectedListDashboard) {
        return (
            <section data-stack="v" data-gap="sm">
                {feedback}
                <p className={styles['placeholder']}>
                    Выберите дашборд, чтобы увидеть свойства.
                </p>
            </section>
        );
    }

    if (!selectedDashboard) {
        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Загружаем дашборд...
            </p>
        );
    }

    const widgetsCount = selectedDashboard.items.length;

    return (
        <section data-stack="v" data-gap="md" aria-label="Dashboard properties">
            <EditableText
                title={selectedDashboard.name}
                fallbackTitle="Без названия"
                saving={renameState.isPending}
                editButtonTestId={dashboardsTestIds.renameButton}
                inputTestId={dashboardsTestIds.renameInput}
                onRename={handleRenameDashboard}
            />

            {feedback}

            <Table
                aria-label="Dashboard properties"
                headers={{ key: 'Property', value: 'Value' }}
                rows={[
                    { key: 'Widgets', value: widgetsCount },
                    { key: 'Created', value: formatDate(selectedDashboard.createdAt) },
                    { key: 'Updated', value: formatDate(selectedDashboard.updatedAt) },
                ]}
            />

            <Button
                variant="danger"
                data-test-id={dashboardsTestIds.deleteButton}
                disabled={deleteDashboardState.isPending}
                onClick={() => void handleDelete()}
            >
                <Trash2 size={18} />
                {deleteConfirmationId === selectedDashboard.id
                    ? 'Подтвердить удаление'
                    : 'Удалить дашборд'}
            </Button>
        </section>
    );
};
