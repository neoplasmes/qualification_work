import { filterActions } from '@/core/processes/entityFiltering';
import {
    useActionsController,
    useActionsPageActions,
    useActionsPageState,
} from '@/ui/pages/actions/model';
import { useFilters } from '@/ui/widgets/FilterPanel';
import { WorkspaceLeftPanel } from '@/ui/widgets/WorkspaceLeftPanel';
import { Plus, Workflow } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { formatDate } from '@/shared/lib/formatDate';
import { WorkspaceLeftPanelItem } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { actionsWorkspaceIndexPath, canMutate, getActionWorkspaceUrl } from '../../lib';

export const ActionsLeftPanel = () => {
    const { selectAction, startCreateAction } = useActionsPageActions();
    const navigate = useNavigate();
    const { org, actionsQuery } = useActionsController();

    const selectedActionId = useActionsPageState(state => state.selectedActionId);
    const isCreatingAction = useActionsPageState(state => state.isCreatingAction);
    const filterValues = useFilters(state => state.values['actions']);

    const filteredActions = useMemo(
        () =>
            filterActions({
                actions: actionsQuery.data,
                values: filterValues,
            }) ?? [],
        [actionsQuery.data, filterValues]
    );

    const canCreate = canMutate(org?.role);

    return (
        <WorkspaceLeftPanel
            title="Действия"
            countLabel={`Всего: ${filteredActions.length}`}
            testId={actionsTestIds.listPanel}
            listLabel="Действия"
            loading={actionsQuery.isPending}
            loadingText="Загрузка действий…"
            empty={filteredActions.length === 0 && !isCreatingAction}
            emptyText="Создайте действие для изменения данных."
            action={{
                label: 'Новое действие',
                Icon: Plus,
                disabled: !canCreate,
                title: canCreate
                    ? undefined
                    : 'Создавать действия могут владельцы и редакторы.',
                onClick: () => {
                    navigate(actionsWorkspaceIndexPath);
                    startCreateAction();
                },
            }}
        >
            {isCreatingAction ? (
                <WorkspaceLeftPanelItem
                    selected
                    header="Новое действие"
                    details={['Черновик', 'Не сохранено']}
                    onClick={() => {
                        navigate(actionsWorkspaceIndexPath);
                        startCreateAction();
                    }}
                />
            ) : null}
            {filteredActions.map(action => (
                <WorkspaceLeftPanelItem
                    key={action.id}
                    selected={selectedActionId === action.id && !isCreatingAction}
                    header={action.name}
                    details={[
                        `Параметров: ${action.parameters.length}`,
                        `Изменений: ${action.effects.length}`,
                        formatDate(action.updatedAt),
                    ]}
                    iconElement={<Workflow size={18} />}
                    onClick={() => {
                        selectAction(action.id);
                        navigate(getActionWorkspaceUrl(action.id, 'view'));
                    }}
                />
            ))}
        </WorkspaceLeftPanel>
    );
};
