import { RefreshCcw, Upload } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';

import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListDatasetsQuery, type DatasetMetadata } from '@/features/datasets';
import { useListChartsQuery } from '@/features/charts';
import { useListDashboardsQuery } from '@/features/dashboards';

import { formatDate } from '@/shared/lib/formatDate';
import { Button, IconButton } from '@/shared/ui';

import {
    selectDataset,
    setShowUpload,
    selectSelectedDatasetId,
    selectFilterChartIds,
    selectFilterDashboardIds,
} from '../model/datasetsPageSlice';

import styles from './DatasetsPage.module.scss';

const getSelectedDataset = (
    datasets: DatasetMetadata[] | undefined,
    selectedDatasetId: string | null
) => {
    if (!datasets || datasets.length === 0) {return undefined;}
    return datasets.find(item => item.dataset.id === selectedDatasetId) ?? datasets[0];
};

export const DatasetsUploadPanel = () => {
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
        () => getSelectedDataset(datasetsQuery.data, selectedDatasetId),
        [datasetsQuery.data, selectedDatasetId]
    );

    const filteredDatasets = useMemo(() => {
        const data = datasetsQuery.data;
        if (!data) {return data;}

        let result = data;

        if (filterChartIds.length > 0) {
            const datasetIdsFromCharts = new Set(
                (chartsQuery.data ?? [])
                    .filter(c => filterChartIds.includes(c.id))
                    .map(c => c.datasetId)
            );
            result = result.filter(d => datasetIdsFromCharts.has(d.dataset.id));
        }

        if (filterDashboardIds.length > 0) {
            const chartIdsInDashboards = new Set(
                (dashboardsQuery.data ?? [])
                    .filter(d => filterDashboardIds.includes(d.id))
                    .flatMap(d => (d.items ?? []).filter(item => item.kind === 'chart').map(item => item.chartId))
            );
            const datasetIdsFromDashboards = new Set(
                (chartsQuery.data ?? [])
                    .filter(c => chartIdsInDashboards.has(c.id))
                    .map(c => c.datasetId)
            );
            result = result.filter(d => datasetIdsFromDashboards.has(d.dataset.id));
        }

        return result;
    }, [datasetsQuery.data, chartsQuery.data, dashboardsQuery.data, filterChartIds, filterDashboardIds]);

    return (
        <aside className={styles['side-panel']}>
            <div data-stack="h" data-align="center" data-justify="between">
                <div data-stack="v" data-gap="xs">
                    <h1 className={styles['title']}>Datasets</h1>
                    <p className={styles['muted']}>{filteredDatasets?.length ?? 0} datasets</p>
                </div>
                <IconButton
                    aria-label="Refresh datasets"
                    disabled={datasetsQuery.isFetching}
                    onClick={() => void datasetsQuery.refetch()}
                >
                    <RefreshCcw size={18} />
                </IconButton>
            </div>

            <Button className={styles['full-button']} onClick={() => dispatch(setShowUpload(true))}>
                <Upload size={18} />
                Upload dataset
            </Button>

            <section className={styles['dataset-list']} aria-label="Datasets">
                {datasetsQuery.isLoading && (
                    <div className={styles['status']}>Loading datasets...</div>
                )}
                {filteredDatasets?.length === 0 && (
                    <div className={styles['empty']}>Upload a dataset to start.</div>
                )}
                {filteredDatasets?.map((item: DatasetMetadata) => (
                    <button
                        type="button"
                        key={item.dataset.id}
                        className={`${styles['dataset-item']} ${
                            selectedDataset?.dataset.id === item.dataset.id
                                ? styles['selected']
                                : ''
                        }`}
                        onClick={() => dispatch(selectDataset(item.dataset.id))}
                    >
                        <div>
                            <div className={styles['dataset-name']}>{item.dataset.name}</div>
                            <div className={styles['dataset-meta']}>
                                <span>{item.totalRows} rows</span>
                                <span>{item.columns.length} cols</span>
                                <span>{formatDate(item.dataset.createdAt)}</span>
                            </div>
                        </div>
                        <span className={styles['badge']}>{item.dataset.sourceType}</span>
                    </button>
                ))}
            </section>
        </aside>
    );
};
