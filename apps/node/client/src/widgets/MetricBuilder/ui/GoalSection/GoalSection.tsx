import type { MetricTargetDirection } from '@qualification-work/types';

import { getValueTypePlaceholder } from '@/shared/lib/valueTypePlaceholder';
import {
    Explain,
    FormField,
    SegmentedControl,
    type SegmentedControlOption,
} from '@/shared/ui';

import { metricBuilderBinds, metricBuilderConfig } from '../../model';

import styles from './GoalSection.module.scss';

const directionOptions = [
    { value: 'higher', label: 'Higher is better' },
    { value: 'lower', label: 'Lower is better' },
] as const satisfies readonly SegmentedControlOption<MetricTargetDirection>[];

type GoalSectionProps = {
    metricName: string;
};

export const GoalSection = ({ metricName }: GoalSectionProps) => {
    const targetInput = metricBuilderConfig.useInput(metricBuilderBinds.target);
    const targetDirectionInput = metricBuilderConfig.useInput(
        metricBuilderBinds.targetDirection
    );
    const hasTarget = targetInput.value.trim() !== '';
    const targetLabel = (
        <span data-display="inline-flex" data-gap="xs" data-align="center">
            Target
            {metricName && (
                <span data-display="inline-flex" data-align="center" data-flex>
                    <span className={styles['target-metric-name']}>{metricName}</span>
                </span>
            )}
        </span>
    );

    return (
        <metricBuilderConfig.Section name="Goal" className={styles['section']}>
            <FormField label={targetLabel}>
                <metricBuilderConfig.Input
                    bind={metricBuilderBinds.target}
                    type="number"
                    inputMode="decimal"
                    placeholder={getValueTypePlaceholder('number')}
                />
            </FormField>
            <FormField
                label={
                    <span data-display="inline-flex" data-gap="xs" data-align="center">
                        Goal direction
                        <Explain
                            label="Explain goal direction"
                            description="Colors the value against the target."
                        />
                    </span>
                }
            >
                <SegmentedControl
                    value={targetDirectionInput.value}
                    options={directionOptions}
                    ariaLabel="Goal direction"
                    className={styles['direction-tabs']}
                    disabled={!hasTarget}
                    onChange={targetDirectionInput.setValue}
                />
            </FormField>
        </metricBuilderConfig.Section>
    );
};
