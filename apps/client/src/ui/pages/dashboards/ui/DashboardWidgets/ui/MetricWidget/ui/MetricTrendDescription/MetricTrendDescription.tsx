import type { MetricTimeBucket } from '@qualification-work/types';

import styles from './MetricTrendDescription.module.css';

const metricTimeBucketLabels = { day: 'День', week: 'Неделя', month: 'Месяц' };

type MetricTrendDescriptionProps = {
    columnName: string;
    timeBucket: MetricTimeBucket;
};

export const MetricTrendDescription = ({
    columnName,
    timeBucket,
}: MetricTrendDescriptionProps) => (
    <span className={styles['description']}>
        <span>Динамика по </span>
        <span className={styles['column-name']}>{columnName}</span>
        <span className={styles['bucket']}> | {metricTimeBucketLabels[timeBucket]}</span>
    </span>
);
