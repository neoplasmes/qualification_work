import type { MetricTimeBucket } from '@qualification-work/types';

import styles from './MetricTrendDescription.module.scss';

type MetricTrendDescriptionProps = {
    columnName: string;
    timeBucket: MetricTimeBucket;
};

export const MetricTrendDescription = ({
    columnName,
    timeBucket,
}: MetricTrendDescriptionProps) => (
    <span className={styles['description']}>
        <span>Trend over </span>
        <span className={styles['column-name']}>{columnName}</span>
        <span className={styles['bucket']}> | {timeBucket}</span>
    </span>
);
