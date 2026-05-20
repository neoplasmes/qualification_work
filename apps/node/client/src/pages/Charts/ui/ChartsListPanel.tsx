import { RefreshCcw } from 'lucide-react';

import type { Chart } from '@/features/charts';
import { ButtonLink, IconButton } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatDate';

import styles from './ChartsPage.module.scss';

type ChartsListPanelProps = {
    charts: Chart[] | undefined;
    loading: boolean;
    fetching: boolean;
    selectedChart: Chart | undefined;
    onSelectChart: (chartId: string) => void;
    onRefresh: () => void;
};

export const ChartsListPanel = ({
    charts,
    loading,
    fetching,
    selectedChart,
    onSelectChart,
    onRefresh,
}: ChartsListPanelProps) => (
    <aside className={styles['panel']}>
        <div data-stack="h" data-align="center" data-justify="between">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Library</span>
                <h1 className={styles['title']}>Charts</h1>
                <p className={styles['muted']}>
                    {charts ? `${charts.length} saved charts` : 'Loading'}
                </p>
            </div>
            <IconButton aria-label="Refresh charts" disabled={fetching} onClick={onRefresh}>
                <RefreshCcw size={18} />
            </IconButton>
        </div>

        <ButtonLink to="/datasets" className={styles['full-button']}>
            New from dataset
        </ButtonLink>

        <section className={styles['chart-list']} aria-label="Saved charts">
            {loading && (
                <div className={styles['status']}>Loading charts...</div>
            )}
            {charts?.length === 0 && (
                <div className={styles['empty']}>
                    Build a chart from a dataset to see it here.
                </div>
            )}
            {charts?.map(chart => (
                <button
                    type="button"
                    key={chart.id}
                    className={`${styles['chart-item']} ${
                        selectedChart?.id === chart.id ? styles['selected'] : ''
                    }`}
                    onClick={() => onSelectChart(chart.id)}
                >
                    <div>
                        <div className={styles['chart-name']}>{chart.name}</div>
                        <div className={styles['chart-meta']}>
                            <span>{formatDate(chart.createdAt)}</span>
                            <span>{chart.datasetId.slice(0, 8)}</span>
                        </div>
                    </div>
                    <span className={styles['badge']}>{chart.chartType}</span>
                </button>
            ))}
        </section>
    </aside>
);
