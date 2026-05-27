import { skipToken } from '@reduxjs/toolkit/query';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import {
    Button,
    EmptyState,
    FilterChip,
    FormField,
    IconButton,
    SegmentedTabs,
    SelectableList,
    TextInput,
} from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import { getEffectLabel } from '../../../lib';
import {
    clearActionsDatasetFilters,
    clearActionsEffectFilters,
    clearActionsRunStatusFilters,
    clearAllActionsFilters,
    selectActionsFilterDatasetIds,
    selectActionsFilterEffectKinds,
    selectActionsFilterRunStatuses,
    selectActionsFiltersTab,
    selectActionsSearchText,
    setActionsFiltersTab,
    setActionsSearchText,
    toggleActionsDatasetFilter,
    toggleActionsEffectFilter,
    toggleActionsRunStatusFilter,
} from '../../../model';

const EFFECT_KIND_OPTIONS = ['insertRow', 'updateRowsByMatch'] as const;
const RUN_STATUS_OPTIONS = ['success', 'failed'] as const;

export const ActionsFilters = () => {
    const dispatch = useDispatch();
    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const filtersTab = useSelector(selectActionsFiltersTab);
    const searchText = useSelector(selectActionsSearchText);
    const datasetIds = useSelector(selectActionsFilterDatasetIds);
    const effectKinds = useSelector(selectActionsFilterEffectKinds);
    const runStatuses = useSelector(selectActionsFilterRunStatuses);
    const hasActiveFilter =
        searchText.trim() ||
        datasetIds.length > 0 ||
        effectKinds.length > 0 ||
        runStatuses.length > 0;

    return (
        <section data-display="grid" data-gap="md" aria-label="Action filters">
            <FormField label="Search">
                <TextInput
                    data-test-id={actionsTestIds.filtersSearchInput}
                    value={searchText}
                    placeholder="Action name"
                    onChange={event => dispatch(setActionsSearchText(event.target.value))}
                />
            </FormField>

            <div data-stack="h" data-gap="xs" data-align="center">
                <div data-flex>
                    <SegmentedTabs
                        columns={3}
                        value={filtersTab}
                        options={[
                            {
                                value: 'datasets',
                                label: 'Datasets',
                                count: datasetIds.length,
                            },
                            {
                                value: 'effects',
                                label: 'Effects',
                                count: effectKinds.length,
                            },
                            {
                                value: 'runs',
                                label: 'Runs',
                                count: runStatuses.length,
                            },
                        ]}
                        onChange={value => dispatch(setActionsFiltersTab(value))}
                    />
                </div>
                {hasActiveFilter && (
                    <IconButton
                        data-test-id={actionsTestIds.clearFiltersButton}
                        aria-label="Clear filters"
                        onClick={() => dispatch(clearAllActionsFilters())}
                    >
                        <X size={16} />
                    </IconButton>
                )}
            </div>

            {filtersTab === 'datasets' && (
                <SelectableList>
                    <Button
                        disabled={datasetIds.length === 0}
                        onClick={() => dispatch(clearActionsDatasetFilters())}
                    >
                        Clear datasets
                    </Button>
                    {datasetsQuery.data?.map(item => (
                        <FilterChip
                            data-test-id={actionsTestIds.filterChip}
                            key={item.dataset.id}
                            selected={datasetIds.includes(item.dataset.id)}
                            label={item.dataset.name}
                            meta={
                                <>
                                    <span>{item.totalRows} rows</span>
                                    <span>{formatDate(item.dataset.updatedAt)}</span>
                                </>
                            }
                            onClick={() =>
                                dispatch(toggleActionsDatasetFilter(item.dataset.id))
                            }
                        />
                    ))}
                    {datasetsQuery.data?.length === 0 && (
                        <EmptyState>No datasets yet.</EmptyState>
                    )}
                </SelectableList>
            )}

            {filtersTab === 'effects' && (
                <SelectableList>
                    <Button
                        disabled={effectKinds.length === 0}
                        onClick={() => dispatch(clearActionsEffectFilters())}
                    >
                        Clear effects
                    </Button>
                    {EFFECT_KIND_OPTIONS.map(kind => (
                        <FilterChip
                            data-test-id={actionsTestIds.filterChip}
                            key={kind}
                            selected={effectKinds.includes(kind)}
                            label={getEffectLabel(kind)}
                            meta={<span>{kind}</span>}
                            onClick={() => dispatch(toggleActionsEffectFilter(kind))}
                        />
                    ))}
                </SelectableList>
            )}

            {filtersTab === 'runs' && (
                <SelectableList>
                    <Button
                        disabled={runStatuses.length === 0}
                        onClick={() => dispatch(clearActionsRunStatusFilters())}
                    >
                        Clear runs
                    </Button>
                    {RUN_STATUS_OPTIONS.map(status => (
                        <FilterChip
                            data-test-id={actionsTestIds.filterChip}
                            key={status}
                            selected={runStatuses.includes(status)}
                            label={status}
                            meta={<span>Run status</span>}
                            onClick={() => dispatch(toggleActionsRunStatusFilter(status))}
                        />
                    ))}
                </SelectableList>
            )}
        </section>
    );
};
