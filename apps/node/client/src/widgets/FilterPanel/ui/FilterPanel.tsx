import { Eraser, LayoutDashboard, Sheet, Workflow } from 'lucide-react';
import { m } from 'motion/react';
import type { CSSProperties } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    clearFilterApplicationScopeValues,
    filterApplicationEntityConfigs,
    selectFilterApplicationActiveTab,
    selectFilterApplicationValues,
    setFilterApplicationActiveTab,
    toggleFilterApplicationValue,
    type FilterApplicationEntity,
} from '@/features/filterApplicationEntities';

import {
    Badge,
    EmptyState,
    IconButton,
    SelectableList,
    StatusMessage,
    WorkspaceLeftPanelItem,
} from '@/shared/ui';

import { createFilterPanelItems } from '../lib';
import {
    useFilterPanelSources,
    type FilterPanelItem,
    type FilterPanelProps,
} from '../model';

import styles from './FilterPanel.module.scss';

const emptyTextByEntity = {
    charts: 'No charts yet.',
    dashboards: 'No dashboards yet.',
    datasets: 'No datasets yet.',
    effects: 'No effects yet.',
} satisfies Record<FilterApplicationEntity, string>;

const filterPanelTabTransition = { duration: 0.2 };

type FilterPanelTabsStyle = CSSProperties & {
    '--filter-tabs-count': number;
};

const getFilterPanelItemIcon = (
    entity: FilterApplicationEntity,
    item: FilterPanelItem
) => {
    if (entity === 'charts') {
        return <Badge>{item.meta[0]}</Badge>;
    }

    if (entity === 'dashboards') {
        return <LayoutDashboard size={18} />;
    }

    if (entity === 'datasets') {
        return <Sheet size={18} />;
    }

    return <Workflow size={18} />;
};

export const FilterPanel = ({ scope, testIds }: FilterPanelProps) => {
    const dispatch = useDispatch();
    const config = filterApplicationEntityConfigs[scope];
    const activeTab = useSelector(selectFilterApplicationActiveTab(scope));
    const values = useSelector(selectFilterApplicationValues(scope));
    const sources = useFilterPanelSources(scope);
    const fallbackTab = config.tabs[0].entity;
    const activeEntity = config.tabs.some(tab => tab.entity === activeTab)
        ? activeTab
        : fallbackTab;
    const activeTabIndex = Math.max(
        config.tabs.findIndex(tab => tab.entity === activeEntity),
        0
    );
    const selectedIds = values[activeEntity];
    const hasSelectedValues = config.tabs.some(tab => values[tab.entity].length > 0);
    const items = createFilterPanelItems({
        scope,
        entity: activeEntity,
        sources,
    });

    let content;

    if (!items) {
        content = <StatusMessage centered>Loading...</StatusMessage>;
    } else if (items.length === 0) {
        content = <EmptyState>{emptyTextByEntity[activeEntity]}</EmptyState>;
    } else {
        content = items.map(item => (
            <WorkspaceLeftPanelItem
                key={item.id}
                testId={testIds?.chip}
                selected={selectedIds.includes(item.id)}
                header={item.label}
                details={item.meta}
                iconElement={getFilterPanelItemIcon(activeEntity, item)}
                onClick={() =>
                    dispatch(
                        toggleFilterApplicationValue({
                            scope,
                            entity: activeEntity,
                            value: item.id,
                        })
                    )
                }
            />
        ));
    }

    return (
        <aside
            className={styles['panel']}
            data-stack="v"
            data-gap="md"
            data-flex
            data-test-id={testIds?.panel}
        >
            <div className={styles['toolbar']}>
                <div
                    className={styles['entity-tabs']}
                    role="tablist"
                    aria-label="Filter section"
                    style={
                        {
                            '--filter-tabs-count': config.tabs.length,
                        } as FilterPanelTabsStyle
                    }
                >
                    <m.div
                        aria-hidden
                        className={styles['active-tab-bg']}
                        initial={false}
                        animate={{ x: `${activeTabIndex * 100}%` }}
                        transition={filterPanelTabTransition}
                    />
                    {config.tabs.map(tab => {
                        const active = activeEntity === tab.entity;
                        const selectedCount = values[tab.entity].length;

                        return (
                            <button
                                key={tab.entity}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                data-test-id={testIds?.tabs?.[tab.entity]}
                                className={`${styles['entity-tab']} ${
                                    active ? styles['active'] : ''
                                }`}
                                onClick={() =>
                                    dispatch(
                                        setFilterApplicationActiveTab({
                                            scope,
                                            entity: tab.entity,
                                        })
                                    )
                                }
                            >
                                <span className={styles['tab-label']}>{tab.label}</span>
                                {selectedCount > 0 ? (
                                    <span className={styles['tab-count']}>
                                        {selectedCount}
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                <IconButton
                    tone="nav"
                    data-test-id={testIds?.clearButton}
                    aria-label="Clear all filters"
                    disabled={!hasSelectedValues}
                    onClick={() => dispatch(clearFilterApplicationScopeValues(scope))}
                >
                    <Eraser size={18} />
                </IconButton>
            </div>

            <SelectableList>{content}</SelectableList>
        </aside>
    );
};
