import { Eraser, LayoutDashboard, Sheet, Workflow } from 'lucide-react';
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

import { CHART_KIND_ICONS } from '@/entities/chart';

import {
    EmptyState,
    IconButton,
    SegmentedControl,
    SelectableList,
    StatusMessage,
    WorkspaceLeftPanelItem,
    type SegmentedControlOption,
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
const filterPanelIconSize = 18;

type FilterPanelTabsStyle = CSSProperties & {
    '--filter-tabs-count': number;
};

const getFilterPanelItemIcon = (
    entity: FilterApplicationEntity,
    item: FilterPanelItem
) => {
    if (entity === 'charts') {
        if (!isChartKind(item.chartKind)) {
            return null;
        }

        const ChartIcon = CHART_KIND_ICONS[item.chartKind];

        return <ChartIcon size={filterPanelIconSize} />;
    }

    if (entity === 'dashboards') {
        return <LayoutDashboard size={filterPanelIconSize} />;
    }

    if (entity === 'datasets') {
        return <Sheet size={filterPanelIconSize} />;
    }

    return <Workflow size={filterPanelIconSize} />;
};

const isChartKind = (value: string | undefined): value is keyof typeof CHART_KIND_ICONS =>
    Boolean(value && value in CHART_KIND_ICONS);

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
    const selectedIds = values[activeEntity];
    const hasSelectedValues = config.tabs.some(tab => values[tab.entity].length > 0);
    const tabOptions = config.tabs.map(tab => ({
        value: tab.entity,
        label: tab.label,
        count: values[tab.entity].length,
        testId: testIds?.tabs?.[tab.entity],
    })) satisfies SegmentedControlOption<FilterApplicationEntity>[];
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
                <SegmentedControl
                    value={activeEntity}
                    options={tabOptions}
                    ariaLabel="Filter section"
                    className={styles['entity-tabs']}
                    classNames={{
                        indicator: styles['active-tab-bg'],
                        item: styles['entity-tab'],
                        itemActive: styles['active'],
                        label: styles['tab-label'],
                        count: styles['tab-count'],
                    }}
                    style={
                        {
                            '--filter-tabs-count': config.tabs.length,
                        } as FilterPanelTabsStyle
                    }
                    transition={filterPanelTabTransition}
                    onChange={entity =>
                        dispatch(
                            setFilterApplicationActiveTab({
                                scope,
                                entity,
                            })
                        )
                    }
                />
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
