import { metricTimeBuckets } from '@qualification-work/types';
import { useMemo } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import { metricBuilderConfig } from '../../model';

import styles from './TrendSection.module.scss';

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
            name="Trend"
            explain="Show a sparkline of the value over time."
            enabledField="showTrend"
            className={styles['section']}
        >
            <FormField label="Time column">
                <metricBuilderConfig.Select field="timeColumn">
                    <option value="">Auto</option>
                    {dateColumns.map(column => (
                        <option key={column.id} value={column.key}>
                            {column.displayName}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </FormField>
            <FormField label="Bucket">
                <metricBuilderConfig.Select field="timeBucket">
                    <option value="">Auto</option>
                    {metricTimeBuckets.map(bucket => (
                        <option key={bucket} value={bucket}>
                            {bucket}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </FormField>
        </metricBuilderConfig.Section>
    );
};
