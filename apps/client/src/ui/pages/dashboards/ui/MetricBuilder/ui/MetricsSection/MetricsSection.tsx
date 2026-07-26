import { Field } from '@qualification-work/design-system';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { Slider } from '@/shared/ui';

import { metricBuilderTestIds } from '../../const';
import { metricBuilderConfig } from '../../model';

import styles from './MetricsSection.module.css';

const metricFormatMaxLength = 24;
const metricMultiplierSliderMin = 0;
const metricMultiplierSliderMax = 100;
const metricMultiplierSliderStep = 0.1;

const getMultiplierSliderValue = (value: string) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return metricMultiplierSliderMin;
    }

    return Math.min(
        metricMultiplierSliderMax,
        Math.max(metricMultiplierSliderMin, numericValue)
    );
};

type MetricsSectionProps = {
    datasets: DatasetMetadata[] | undefined;
    metricNamePlaceholder: string;
    onMetricNameDirtyChange: (value: boolean) => void;
};

export const MetricsSection = ({
    datasets,
    metricNamePlaceholder,
    onMetricNameDirtyChange,
}: MetricsSectionProps) => {
    const formatInput = metricBuilderConfig.useInput('format');
    const valueMultiplierInput = metricBuilderConfig.useInput('valueMultiplier');

    const handleFormatValueChange = (value: string) => {
        const normalizedMultiplier = valueMultiplierInput.value.trim();
        const shouldAutoPercentMultiplier =
            value.trim() === '%' &&
            formatInput.value.trim() !== '%' &&
            (normalizedMultiplier === '' || Number(normalizedMultiplier) === 1);

        if (shouldAutoPercentMultiplier) {
            valueMultiplierInput.setValue('100');
        }
    };

    return (
        <metricBuilderConfig.Section name="Metrics" className={styles['section']}>
            <Field label="Dataset">
                <metricBuilderConfig.Select
                    field="datasetId"
                    data-test-id={metricBuilderTestIds.datasetSelect}
                >
                    {datasets?.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </Field>
            <Field label="Metric name">
                <metricBuilderConfig.Input
                    field="name"
                    data-test-id={metricBuilderTestIds.nameInput}
                    placeholder={metricNamePlaceholder || 'Average score'}
                    onValueChange={() => {
                        onMetricNameDirtyChange(true);
                    }}
                />
            </Field>
            <Field label="Format">
                <metricBuilderConfig.Input
                    field="format"
                    data-test-id={metricBuilderTestIds.formatInput}
                    maxLength={metricFormatMaxLength}
                    placeholder="%, ₽, шт"
                    onValueChange={handleFormatValueChange}
                />
            </Field>
            <Field label="Multiplier">
                <div
                    className={styles['multiplier-row']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    <metricBuilderConfig.Input
                        field="valueMultiplier"
                        className={styles['multiplier-input']}
                        data-test-id={metricBuilderTestIds.valueMultiplierInput}
                        type="number"
                        inputMode="decimal"
                        placeholder="1"
                    />
                    <Slider
                        className={styles['multiplier-slider']}
                        data-flex
                        aria-label="Multiplier"
                        min={metricMultiplierSliderMin}
                        max={metricMultiplierSliderMax}
                        step={metricMultiplierSliderStep}
                        value={getMultiplierSliderValue(valueMultiplierInput.value)}
                        onChange={event =>
                            valueMultiplierInput.setValue(event.currentTarget.value)
                        }
                    />
                </div>
            </Field>
        </metricBuilderConfig.Section>
    );
};
