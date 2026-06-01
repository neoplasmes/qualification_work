import { metricTimeBuckets, type MetricTimeBucket } from '@qualification-work/types';

import type { DatasetColumn } from '@/entities/dataset';

import { FormField, Select } from '@/shared/ui';

import type { MetricConfigForm } from '../../../../lib';

type MetricTrendFieldsProps = {
    config: MetricConfigForm;
    dateColumns: DatasetColumn[];
    onConfigChange: (patch: Partial<MetricConfigForm>) => void;
};

export const MetricTrendFields = ({
    config,
    dateColumns,
    onConfigChange,
}: MetricTrendFieldsProps) => (
    <>
        {config.showTrend && (
            <>
                <FormField label="Time column">
                    <Select
                        value={config.timeColumn}
                        onChange={event =>
                            onConfigChange({ timeColumn: event.target.value })
                        }
                    >
                        <option value="">Auto</option>
                        {dateColumns.map(column => (
                            <option key={column.id} value={column.key}>
                                {column.displayName}
                            </option>
                        ))}
                    </Select>
                </FormField>
                <FormField label="Bucket">
                    <Select
                        value={config.timeBucket}
                        onChange={event =>
                            onConfigChange({
                                timeBucket: event.target.value as MetricTimeBucket | '',
                            })
                        }
                    >
                        <option value="">Auto</option>
                        {metricTimeBuckets.map(bucket => (
                            <option key={bucket} value={bucket}>
                                {bucket}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </>
        )}
    </>
);
