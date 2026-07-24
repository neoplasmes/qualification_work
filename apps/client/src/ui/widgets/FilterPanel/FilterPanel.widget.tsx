import { type FilterApplicationEntity } from '@/core/processes/entityFiltering';
import { chartKindIcons } from '@/ui/widgets/ChartShell';
import { filterApplicationEntityConfigs } from '@/ui/widgets/FilterPanel/const';
import { useFilters, useFiltersActions } from '@/ui/widgets/FilterPanel/model/filters';
import { IconButton } from '@qualification-work/design-system';
import { Eraser, LayoutDashboard, Sheet, Workflow } from 'lucide-react';

import {
    EmptyState,
    SegmentedControl,
    StatusMessage,
    WorkspaceLeftPanelItem,
    type SegmentedControlOption,
} from '@/shared/ui';

import { createFilterPanelItems } from './lib';
import {
    useFilterPanelSources,
    type FilterPanelItem,
    type FilterPanelProps,
} from './model';

import styles from './filterPanel.widget.module.css';

const emptyTextByEntity = {
    charts: 'No charts yet.',
    dashboards: 'No dashboards yet.',
    datasets: 'No datasets yet.',
    effects: 'No effects yet.',
} satisfies Record<FilterApplicationEntity, string>;

const filterPanelIconSize = 18;

const getFilterPanelItemIcon = (
    entity: FilterApplicationEntity,
    item: FilterPanelItem
) => {
    if (entity === 'charts') {
        if (!isChartKind(item.chartKind)) {
            return null;
        }

        const ChartIcon = chartKindIcons[item.chartKind];

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

const isChartKind = (value: string | undefined): value is keyof typeof chartKindIcons =>
    Boolean(value && value in chartKindIcons);

export const FilterPanel = ({ scope, testIds }: FilterPanelProps) => {
    const {
        clearFilterApplicationScopeValues,
        setFilterApplicationActiveTab,
        toggleFilterApplicationValue,
    } = useFiltersActions();
    const config = filterApplicationEntityConfigs[scope];
    const activeTab = useFilters(state => state.activeTabs[scope]);
    const values = useFilters(state => state.values[scope]);
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
                    toggleFilterApplicationValue({
                        scope,
                        entity: activeEntity,
                        value: item.id,
                    })
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
                    data-py="sm"
                    ariaLabel="Filter section"
                    className={styles['entity-tabs']}
                    onChange={entity =>
                        setFilterApplicationActiveTab({
                            scope,
                            entity,
                        })
                    }
                />
                <IconButton
                    variant="ghost"
                    data-test-id={testIds?.clearButton}
                    aria-label="Clear all filters"
                    disabled={!hasSelectedValues}
                    onClick={() => clearFilterApplicationScopeValues(scope)}
                >
                    <Eraser size={18} />
                </IconButton>
            </div>

            <div data-stack="v" data-gap="xs">
                {content}
            </div>
        </aside>
    );
};
