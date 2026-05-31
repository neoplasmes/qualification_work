import type { metricTargetDirections } from '@qualification-work/types';

import { FormField, SegmentedTabs, TextInput } from '@/shared/ui';

import type { MetricConfigForm } from '../../../../lib';

const directionOptions = [
    { value: 'higher', label: 'Higher is better' },
    { value: 'lower', label: 'Lower is better' },
] as const satisfies readonly {
    value: (typeof metricTargetDirections)[number];
    label: string;
}[];

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
            <FormField label="Goal direction" hint="colors the value vs the target">
                <SegmentedTabs
                    value={config.targetDirection}
                    options={directionOptions}
                    disabled={!hasTarget}
                    onChange={value => onConfigChange({ targetDirection: value })}
                />
            </FormField>
        </>
    );
};
