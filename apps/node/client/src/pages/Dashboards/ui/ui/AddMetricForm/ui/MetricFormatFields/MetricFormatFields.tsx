import type { DashboardMetricItem } from '@/entities/dashboard';

import { FormField, Slider, TextInput } from '@/shared/ui';

import { dashboardsTestIds } from '../../../../../const';

import styles from './MetricFormatFields.module.scss';

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

type MetricFormatFieldsProps = {
    format: DashboardMetricItem['format'];
    valueMultiplier: string;
    onFormatChange: (value: DashboardMetricItem['format']) => void;
    onValueMultiplierChange: (value: string) => void;
};

export const MetricFormatFields = ({
    format,
    valueMultiplier,
    onFormatChange,
    onValueMultiplierChange,
}: MetricFormatFieldsProps) => {
    const handleFormatChange = (value: string) => {
        const nextFormat = value;
        const normalizedMultiplier = valueMultiplier.trim();
        const shouldAutoPercentMultiplier =
            nextFormat.trim() === '%' &&
            format.trim() !== '%' &&
            (normalizedMultiplier === '' || Number(normalizedMultiplier) === 1);

        onFormatChange(nextFormat);

        if (shouldAutoPercentMultiplier) {
            onValueMultiplierChange('100');
        }
    };

    return (
        <>
            <FormField label="Format">
                <TextInput
                    data-test-id={dashboardsTestIds.metricFormatSelect}
                    value={format}
                    maxLength={metricFormatMaxLength}
                    placeholder="%, ₽, шт"
                    onChange={event => handleFormatChange(event.target.value)}
                />
            </FormField>
            <FormField label="Multiplier">
                <div className={styles['multiplier-row']}>
                    <TextInput
                        className={styles['multiplier-input']}
                        data-test-id={dashboardsTestIds.metricValueMultiplierInput}
                        type="number"
                        inputMode="decimal"
                        value={valueMultiplier}
                        placeholder="1"
                        onChange={event => onValueMultiplierChange(event.target.value)}
                    />
                    <Slider
                        className={styles['multiplier-slider']}
                        aria-label="Multiplier"
                        min={metricMultiplierSliderMin}
                        max={metricMultiplierSliderMax}
                        step={metricMultiplierSliderStep}
                        value={getMultiplierSliderValue(valueMultiplier)}
                        onChange={event => onValueMultiplierChange(event.target.value)}
                    />
                </div>
            </FormField>
        </>
    );
};
