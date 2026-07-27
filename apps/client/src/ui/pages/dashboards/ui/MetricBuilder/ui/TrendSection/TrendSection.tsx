import { Field } from '@qualification-work/design-system';
import { metricTimeBuckets } from '@qualification-work/types';
import { useMemo } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { metricBuilderConfig } from '../../model';

import styles from './TrendSection.module.css';

const metricTimeBucketLabels = { day: 'День', week: 'Неделя', month: 'Месяц' };

type TrendSectionProps = {
    datasets: DatasetMetadata[] | undefined;
};

export const TrendSection = ({ datasets }: TrendSectionProps) => {
    const datasetIdInput = metricBuilderConfig.useInput('datasetId');
    const selectedDataset = useMemo(
        () => datasets?.find(item => item.dataset.id === datasetIdInput.value) ?? null,
        [datasets, datasetIdInput.value]
    );
    const dateColumns = useMemo(
        () =>
            (selectedDataset?.columns ?? []).filter(column => column.dataType === 'date'),
        [selectedDataset?.columns]
    );

    return (
        <metricBuilderConfig.Section
            name="Динамика"
            explain="Показывает изменение значения во времени."
            enabledField="showTrend"
            className={styles['section']}
        >
            <Field label="Поле времени">
                <metricBuilderConfig.Select field="timeColumn">
                    <option value="">Автоматически</option>
                    {dateColumns.map(column => (
                        <option key={column.id} value={column.key}>
                            {column.displayName}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </Field>
            <Field label="Период">
                <metricBuilderConfig.Select field="timeBucket">
                    <option value="">Автоматически</option>
                    {metricTimeBuckets.map(bucket => (
                        <option key={bucket} value={bucket}>
                            {metricTimeBucketLabels[bucket]}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </Field>
        </metricBuilderConfig.Section>
    );
};
