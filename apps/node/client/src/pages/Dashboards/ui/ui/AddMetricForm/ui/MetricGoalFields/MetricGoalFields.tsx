import type { metricTargetDirections } from '@qualification-work/types';

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
    onConfigChange: (patch: Partial<MetricConfigForm>) => void;
};

export const MetricGoalFields = ({ config, onConfigChange }: MetricGoalFieldsProps) => {
    const hasTarget = config.target.trim() !== '';

    return (
        <>
            <FormField label="Target">
                <TextInput
                    type="number"
                    inputMode="decimal"
                    value={config.target}
                    placeholder="No target"
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
                    classNames={{
                        indicator: styles['direction-indicator'],
                        item: styles['direction-tab'],
                        itemActive: styles['active'],
                        label: styles['direction-label'],
                    }}
                    disabled={!hasTarget}
                    onChange={value => onConfigChange({ targetDirection: value })}
                />
            </FormField>
        </>
    );
};
