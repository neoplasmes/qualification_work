import type { DatasetMetadata } from '@/entities/dataset';

import { FormField, Slider } from '@/shared/ui';

import { metricBuilderTestIds } from '../../const';
import { metricBuilderBinds, metricBuilderConfig } from '../../model';

import styles from './MetricsSection.module.scss';

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
    const formatInput = metricBuilderConfig.useInput(metricBuilderBinds.format);
    const valueMultiplierInput = metricBuilderConfig.useInput(
        metricBuilderBinds.valueMultiplier
    );

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
            <FormField label="Dataset">
                <metricBuilderConfig.Select
                    bind={metricBuilderBinds.datasetId}
                    data-test-id={metricBuilderTestIds.datasetSelect}
                >
                    {datasets?.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </metricBuilderConfig.Select>
            </FormField>
            <FormField label="Metric name">
                <metricBuilderConfig.Input
                    bind={metricBuilderBinds.name}
                    data-test-id={metricBuilderTestIds.nameInput}
                    placeholder={metricNamePlaceholder || 'Average score'}
                    onValueChange={() => {
                        onMetricNameDirtyChange(true);
                    }}
                />
            </FormField>
            <FormField label="Format">
                <metricBuilderConfig.Input
                    bind={metricBuilderBinds.format}
                    data-test-id={metricBuilderTestIds.formatInput}
                    maxLength={metricFormatMaxLength}
                    placeholder="%, ₽, шт"
                    onValueChange={handleFormatValueChange}
                />
            </FormField>
            <FormField label="Multiplier">
                <div
                    className={styles['multiplier-row']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    <metricBuilderConfig.Input
                        bind={metricBuilderBinds.valueMultiplier}
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
            </FormField>
        </metricBuilderConfig.Section>
    );
};
