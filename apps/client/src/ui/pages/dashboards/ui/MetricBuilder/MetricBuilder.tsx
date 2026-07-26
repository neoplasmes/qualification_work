import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type SubmitEventHandler,
} from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { StatusMessage } from '@/shared/ui';

import { metricBuilderTestIds } from './const';
import {
    createMetricBuilderOutput,
    metricBuilderConfig,
    type MetricBuilderDraft,
    type MetricBuilderOutput,
} from './model';
import { ExpressionSection, GoalSection, MetricsSection, TrendSection } from './ui';

import styles from './MetricBuilder.module.css';

export type MetricBuilderProps = {
    datasets: DatasetMetadata[] | undefined;
    value: MetricBuilderDraft;
    error?: string;
    editing?: boolean;
    formId?: string;
    onChange: (value: MetricBuilderDraft) => void;
    onOutputChange?: (value: MetricBuilderOutput) => void;
    onSubmit: SubmitEventHandler<HTMLFormElement>;
};

export const MetricBuilder = ({
    datasets,
    value,
    error,
    editing,
    formId,
    onChange,
    onOutputChange,
    onSubmit,
}: MetricBuilderProps) => {
    const [isMetricNameDirty, setIsMetricNameDirty] = useState(false);
    const [builtMetricName, setBuiltMetricName] = useState('');
    const handleBuilderMetricNameChange = useCallback((nextMetricName: string) => {
        setBuiltMetricName(nextMetricName);
    }, []);
    const targetMetricName = value.name.trim() || builtMetricName;
    const output = useMemo(() => createMetricBuilderOutput(value), [value]);

    useEffect(() => {
        onOutputChange?.(output);
    }, [onOutputChange, output]);

    return (
        <metricBuilderConfig.Root
            id={formId}
            className={styles['form']}
            data-test-id={metricBuilderTestIds.form}
            aria-label={editing ? 'Edit metric' : 'Add metric'}
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
        >
            <MetricsSection
                datasets={datasets}
                metricNamePlaceholder={builtMetricName}
                onMetricNameDirtyChange={setIsMetricNameDirty}
            />
            <ExpressionSection
                datasets={datasets}
                isMetricNameDirty={isMetricNameDirty}
                onBuilderMetricNameChange={handleBuilderMetricNameChange}
            />
            <GoalSection metricName={targetMetricName} />
            <TrendSection datasets={datasets} />

            {error && (
                <StatusMessage tone="error" className={styles['error']}>
                    {error}
                </StatusMessage>
            )}
        </metricBuilderConfig.Root>
    );
};
