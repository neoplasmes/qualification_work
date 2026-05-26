import { skipToken } from '@reduxjs/toolkit/query';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListDatasetsQuery } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

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

import styles from '../../ActionsPage.module.scss';

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
        <section className={styles['right-section']} aria-label="Action filters">
            <div className={styles['header-row']}>
                <span className={styles['eyebrow']}>Filter by</span>
                <IconButton
                    data-test-id={actionsTestIds.clearFiltersButton}
                    aria-label="Clear filters"
                    style={{ visibility: hasActiveFilter ? 'visible' : 'hidden' }}
                    onClick={() => dispatch(clearAllActionsFilters())}
                >
                    <X size={16} />
                </IconButton>
            </div>

            <label className={styles['control']}>
                <span>Search</span>
                <input
                    data-test-id={actionsTestIds.filtersSearchInput}
                    value={searchText}
                    placeholder="Action name"
                    onChange={event => dispatch(setActionsSearchText(event.target.value))}
                />
            </label>

            <div className={`${styles['tabs']} ${styles['tabs-three']}`}>
                <FilterTabButton
                    active={filtersTab === 'datasets'}
                    count={datasetIds.length}
                    label="Datasets"
                    onClick={() => dispatch(setActionsFiltersTab('datasets'))}
                />
                <FilterTabButton
                    active={filtersTab === 'effects'}
                    count={effectKinds.length}
                    label="Effects"
                    onClick={() => dispatch(setActionsFiltersTab('effects'))}
                />
                <FilterTabButton
                    active={filtersTab === 'runs'}
                    count={runStatuses.length}
                    label="Runs"
                    onClick={() => dispatch(setActionsFiltersTab('runs'))}
                />
            </div>

            {filtersTab === 'datasets' && (
                <div className={styles['filter-list']}>
                    <Button
                        disabled={datasetIds.length === 0}
                        onClick={() => dispatch(clearActionsDatasetFilters())}
                    >
                        Clear datasets
                    </Button>
                    {datasetsQuery.data?.map(item => (
                        <button
                            type="button"
                            data-test-id={actionsTestIds.filterChip}
                            key={item.dataset.id}
                            className={`${styles['filter-chip']} ${
                                datasetIds.includes(item.dataset.id)
                                    ? styles['selected']
                                    : ''
                            }`}
                            onClick={() =>
                                dispatch(toggleActionsDatasetFilter(item.dataset.id))
                            }
                        >
                            <div className={styles['filter-chip-name']}>
                                {item.dataset.name}
                            </div>
                            <div className={styles['filter-chip-meta']}>
                                <span>{item.totalRows} rows</span>
                                <span>{formatDate(item.dataset.updatedAt)}</span>
                            </div>
                        </button>
                    ))}
                    {datasetsQuery.data?.length === 0 && (
                        <div className={styles['empty']}>No datasets yet.</div>
                    )}
                </div>
            )}

            {filtersTab === 'effects' && (
                <div className={styles['filter-list']}>
                    <Button
                        disabled={effectKinds.length === 0}
                        onClick={() => dispatch(clearActionsEffectFilters())}
                    >
                        Clear effects
                    </Button>
                    {(['insertRow', 'updateRowsByMatch'] as const).map(kind => (
                        <button
                            type="button"
                            data-test-id={actionsTestIds.filterChip}
                            key={kind}
                            className={`${styles['filter-chip']} ${
                                effectKinds.includes(kind) ? styles['selected'] : ''
                            }`}
                            onClick={() => dispatch(toggleActionsEffectFilter(kind))}
                        >
                            <div className={styles['filter-chip-name']}>
                                {getEffectLabel(kind)}
                            </div>
                            <div className={styles['filter-chip-meta']}>
                                <span>{kind}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {filtersTab === 'runs' && (
                <div className={styles['filter-list']}>
                    <Button
                        disabled={runStatuses.length === 0}
                        onClick={() => dispatch(clearActionsRunStatusFilters())}
                    >
                        Clear runs
                    </Button>
                    {(['success', 'failed'] as const).map(status => (
                        <button
                            type="button"
                            data-test-id={actionsTestIds.filterChip}
                            key={status}
                            className={`${styles['filter-chip']} ${
                                runStatuses.includes(status) ? styles['selected'] : ''
                            }`}
                            onClick={() => dispatch(toggleActionsRunStatusFilter(status))}
                        >
                            <div className={styles['filter-chip-name']}>{status}</div>
                            <div className={styles['filter-chip-meta']}>
                                <span>Run status</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};

type FilterTabButtonProps = {
    active: boolean;
    count: number;
    label: string;
    onClick: () => void;
};

const FilterTabButton = ({ active, count, label, onClick }: FilterTabButtonProps) => (
    <button
        type="button"
        className={`${styles['tab']} ${active ? styles['active'] : ''}`}
        onClick={onClick}
    >
        {label}
        {count > 0 && <span className={styles['tab-count']}>{count}</span>}
    </button>
);
