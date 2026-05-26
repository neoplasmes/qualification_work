import { skipToken } from '@reduxjs/toolkit/query';
import { Upload } from 'lucide-react';
import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery } from '@/features/authenticate';

import { useListChartsQuery } from '@/entities/chart';
import { useListDashboardsQuery } from '@/entities/dashboard';
import { useListDatasetsQuery, type DatasetMetadata } from '@/entities/dataset';

import { formatDate } from '@/shared/lib/formatDate';
import { getSelected } from '@/shared/lib/getSelected';
import { Badge, Button, EmptyState, StatusMessage } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';
import { filterDatasets } from '../../../lib';
import {
    selectDataset,
    selectFilterChartIds,
    selectFilterDashboardIds,
    selectSelectedDatasetId,
    setShowUpload,
} from '../../../model';

import styles from './DatasetsLeftPanel.module.scss';

export const DatasetsLeftPanel = () => {
    const dispatch = useDispatch();

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);
    const chartsQuery = useListChartsQuery(org?.id ?? skipToken);
    const dashboardsQuery = useListDashboardsQuery(org?.id ?? skipToken);

    const selectedDatasetId = useSelector(selectSelectedDatasetId);
    const filterChartIds = useSelector(selectFilterChartIds);
    const filterDashboardIds = useSelector(selectFilterDashboardIds);

    const selectedDataset = useMemo(
        () => getSelected(datasetsQuery.data, selectedDatasetId, item => item.dataset.id),
        [datasetsQuery.data, selectedDatasetId]
    );

    const filteredDatasets = useMemo(
        () =>
            filterDatasets({
                datasets: datasetsQuery.data,
                charts: chartsQuery.data,
                dashboards: dashboardsQuery.data,
                chartIds: filterChartIds,
                dashboardIds: filterDashboardIds,
            }),
        [
            chartsQuery.data,
            dashboardsQuery.data,
            datasetsQuery.data,
            filterChartIds,
            filterDashboardIds,
        ]
    );

    return (
        <aside
            className={styles['side-panel']}
            data-test-id={datasetsTestIds.uploadPanel}
        >
            <div data-stack="h" data-align="center" data-justify="between">
                <h1 className={styles['title']}>Datasets</h1>
                <span className={styles['muted']}>
                    {filteredDatasets?.length ?? 0} datasets
                </span>
            </div>

            <Button
                className={styles['full-button']}
                data-test-id={datasetsTestIds.uploadButton}
                onClick={() => dispatch(setShowUpload(true))}
            >
                <Upload size={18} />
                Upload dataset
            </Button>

            <section className={styles['dataset-list']} aria-label="Datasets">
                {datasetsQuery.isLoading && (
                    <StatusMessage centered>Loading datasets...</StatusMessage>
                )}
                {filteredDatasets?.length === 0 && (
                    <EmptyState>Upload a dataset to start.</EmptyState>
                )}
                {filteredDatasets?.map((item: DatasetMetadata) => (
                    <button
                        type="button"
                        key={item.dataset.id}
                        data-test-id={datasetsTestIds.datasetListItem}
                        className={`${styles['dataset-item']} ${
                            selectedDataset?.dataset.id === item.dataset.id
                                ? styles['selected']
                                : ''
                        }`}
                        onClick={() => dispatch(selectDataset(item.dataset.id))}
                    >
                        <div>
                            <div className={styles['dataset-name']}>
                                {item.dataset.name}
                            </div>
                            <div className={styles['dataset-meta']}>
                                <span>{formatDate(item.dataset.createdAt)}</span>
                            </div>
                        </div>
                        <Badge>{item.dataset.sourceType}</Badge>
                    </button>
                ))}
            </section>
        </aside>
    );
};
