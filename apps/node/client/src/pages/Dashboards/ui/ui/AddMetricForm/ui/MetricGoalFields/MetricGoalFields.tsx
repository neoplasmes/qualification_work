import type { metricTargetDirections } from '@qualification-work/types';

import { getValueTypePlaceholder } from '@/shared/lib/valueTypePlaceholder';
import {
    Explain,
    FormField,
    SegmentedControl,
    TextInput,
    type SegmentedControlOption,
} from '@/shared/ui';

import type { MetricConfigForm } from '../../../../lib';

import styles from './MetricGoalFields.module.scss';

const directionOptions = [
    { value: 'higher', label: 'Higher is better' },
    { value: 'lower', label: 'Lower is better' },
] as const satisfies readonly SegmentedControlOption<
    (typeof metricTargetDirections)[number]
>[];

type MetricGoalFieldsProps = {
    config: MetricConfigForm;
    metricName: string;
    onConfigChange: (patch: Partial<MetricConfigForm>) => void;
};

export const MetricGoalFields = ({
    config,
    metricName,
    onConfigChange,
}: MetricGoalFieldsProps) => {
    const hasTarget = config.target.trim() !== '';
    const targetLabel = (
        <span className={styles['target-label']}>
            Target
            {metricName && (
                <span className={styles['target-metric']}>
                    <span className={styles['target-metric-name']}>{metricName}</span>
                </span>
            )}
        </span>
    );

    return (
        <>
            <FormField label={targetLabel}>
                <TextInput
                    type="number"
                    inputMode="decimal"
                    value={config.target}
                    placeholder={getValueTypePlaceholder('number')}
                    onChange={event => onConfigChange({ target: event.target.value })}
                />
            </FormField>
            <FormField
                label={
                    <span className={styles['label-with-explain']}>
                        Goal direction
                        <Explain
                            label="Explain goal direction"
                            description="Colors the value against the target."
                        />
                    </span>
                }
            >
                <SegmentedControl
                    value={config.targetDirection}
                    options={directionOptions}
                    ariaLabel="Goal direction"
                    className={styles['direction-tabs']}
                    disabled={!hasTarget}
                    onChange={value => onConfigChange({ targetDirection: value })}
                />
            </FormField>
        </>
    );
};
