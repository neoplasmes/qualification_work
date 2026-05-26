import { skipToken } from '@reduxjs/toolkit/query';
import { ListFilter, ScrollText, Settings2 } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListActionsQuery } from '@/entities/action';

import { actionsTestIds } from '../../../const';
import { getSelectedAction } from '../../../lib';
import {
    selectActionsRightPanelTab,
    selectIsCreatingAction,
    selectSelectedActionId,
    setActionsRightPanelTab,
    type ActionsRightPanelTab,
} from '../../../model';

import { ActionsFilters } from '../ActionsFilters';
import { ActionsHistory } from '../ActionsHistory';
import { ActionsProperties } from '../ActionsProperties';

import styles from '../../ActionsPage.module.scss';

const tabs: Array<{
    id: ActionsRightPanelTab;
    label: string;
    testId: string;
    icon: typeof ScrollText;
}> = [
    {
        id: 'history',
        label: 'History',
        testId: actionsTestIds.historyTab,
        icon: ScrollText,
    },
    {
        id: 'properties',
        label: 'Properties',
        testId: actionsTestIds.propertiesTab,
        icon: Settings2,
    },
    {
        id: 'filters',
        label: 'Filters',
        testId: actionsTestIds.filtersTab,
        icon: ListFilter,
    },
];

export const ActionsRightPanel = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const activeTab = useSelector(selectActionsRightPanelTab);
    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);

    const selectedAction = useMemo(
        () =>
            isCreatingAction
                ? undefined
                : getSelectedAction(actionsQuery.data, selectedActionId),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );

    return (
        <aside className={styles['right-panel']} data-test-id={actionsTestIds.rightPanel}>
            <div className={`${styles['tabs']} ${styles['tabs-three']}`}>
                {tabs.map(tab => {
                    const Icon = tab.icon;

                    return (
                        <button
                            type="button"
                            key={tab.id}
                            data-test-id={tab.testId}
                            className={`${styles['tab']} ${activeTab === tab.id ? styles['active'] : ''}`}
                            onClick={() => dispatch(setActionsRightPanelTab(tab.id))}
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'history' && (
                <ActionsHistory selectedAction={selectedAction} />
            )}
            {activeTab === 'properties' && (
                <ActionsProperties selectedAction={selectedAction} />
            )}
            {activeTab === 'filters' && <ActionsFilters />}
        </aside>
    );
};
