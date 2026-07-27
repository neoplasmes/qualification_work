import { Field } from '@qualification-work/design-system';
import type { MetricTargetDirection } from '@qualification-work/types';

import { getValueTypePlaceholder } from '@/shared/lib/valueTypePlaceholder';
import { Explain, SegmentedControl, type SegmentedControlOption } from '@/shared/ui';

import { metricBuilderConfig } from '../../model';

import styles from './GoalSection.module.css';

const directionOptions = [
    { value: 'higher', label: 'Больше — лучше' },
    { value: 'lower', label: 'Меньше — лучше' },
] as const satisfies readonly SegmentedControlOption<MetricTargetDirection>[];

type GoalSectionProps = {
    metricName: string;
};

export const GoalSection = ({ metricName }: GoalSectionProps) => {
    const targetInput = metricBuilderConfig.useInput('target');
    const targetDirectionInput = metricBuilderConfig.useInput('targetDirection');
    const hasTarget = targetInput.value.trim() !== '';
    const targetLabel = (
        <span data-display="inline-flex" data-gap="xs" data-align="center">
            Цель
            {metricName && (
                <span data-display="inline-flex" data-align="center" data-flex>
                    <span className={styles['target-metric-name']}>{metricName}</span>
                </span>
            )}
        </span>
    );

    return (
        <metricBuilderConfig.Section name="Цель" className={styles['section']}>
            <Field label={targetLabel}>
                <metricBuilderConfig.Input
                    field="target"
                    type="number"
                    inputMode="decimal"
                    placeholder={getValueTypePlaceholder('number')}
                />
            </Field>
            <Field
                label={
                    <span data-display="inline-flex" data-gap="xs" data-align="center">
                        Направление цели
                        <Explain
                            label="Как работает направление цели"
                            description="Цвет значения показывает, достигнута ли цель."
                        />
                    </span>
                }
            >
                <SegmentedControl
                    value={targetDirectionInput.value}
                    options={directionOptions}
                    ariaLabel="Направление цели"
                    className={styles['direction-tabs']}
                    disabled={!hasTarget}
                    onChange={targetDirectionInput.setValue}
                />
            </Field>
        </metricBuilderConfig.Section>
    );
};
