import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import {
    clearFilterApplicationValues,
    filterApplicationEntityConfigs,
    selectFilterApplicationActiveTab,
    selectFilterApplicationValues,
    setFilterApplicationActiveTab,
    toggleFilterApplicationValue,
    type FilterApplicationEntity,
} from '@/features/filterApplicationEntities';

import {
    EmptyState,
    FilterChip,
    IconButton,
    SegmentedTabs,
    SelectableList,
    StatusMessage,
} from '@/shared/ui';

import { createFilterPanelItems } from '../lib';
import { useFilterPanelSources, type FilterPanelProps } from '../model';

import styles from './FilterPanel.module.scss';

const emptyTextByEntity = {
    charts: 'No charts yet.',
    dashboards: 'No dashboards yet.',
    datasets: 'No datasets yet.',
    effects: 'No effects yet.',
    runs: 'No runs yet.',
} satisfies Record<FilterApplicationEntity, string>;

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
            <FilterChip
                key={item.id}
                data-test-id={testIds?.chip}
                selected={selectedIds.includes(item.id)}
                label={item.label}
                meta={item.meta.map(meta => (
                    <span key={meta}>{meta}</span>
                ))}
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
            <div data-stack="h" data-gap="xs" data-align="center">
                <div data-flex>
                    <SegmentedTabs
                        columns={config.tabs.length === 3 ? 3 : 2}
                        value={activeEntity}
                        options={config.tabs.map(tab => ({
                            value: tab.entity,
                            label: tab.label,
                            count: values[tab.entity].length,
                            testId: testIds?.tabs?.[tab.entity],
                        }))}
                        onChange={entity =>
                            dispatch(setFilterApplicationActiveTab({ scope, entity }))
                        }
                    />
                </div>
                <IconButton
                    data-test-id={testIds?.clearButton}
                    aria-label="Clear filter"
                    disabled={selectedIds.length === 0}
                    onClick={() =>
                        dispatch(
                            clearFilterApplicationValues({
                                scope,
                                entity: activeEntity,
                            })
                        )
                    }
                >
                    <X size={16} />
                </IconButton>
            </div>

            <SelectableList>{content}</SelectableList>
        </aside>
    );
};
