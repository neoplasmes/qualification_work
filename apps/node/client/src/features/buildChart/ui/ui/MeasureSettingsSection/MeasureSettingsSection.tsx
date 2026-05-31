import { AGGREGATE_LABELS, VALUE_FORMAT_LABELS } from '@/entities/chart';

import { Select, TextInput } from '@/shared/ui';

import type { Aggregate, MeasureValueFormat } from '../../../api';
import { aggregates, valueFormats } from '../../../const';
import { needsColumn } from '../../../lib';
import type { ChartBuilderDerivedState, ChartBuilderState } from '../../../model';

import { AnalysisColumnOptions } from '../AnalysisColumnOptions';

import styles from '../../DatasetChartBuilder.module.scss';

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

type MeasureSettingsSectionProps = {
    derived: ChartBuilderDerivedState;
    fields: ChartBuilderState;
};

export const MeasureSettingsSection = ({
    derived,
    fields,
}: MeasureSettingsSectionProps) => (
    <>
        <div
            className={styles['section']}
            data-stack="h"
            data-gap="sm"
            data-align="center"
        >
            Measure
        </div>

        <label className={styles['control']} data-stack="v" data-gap="xs">
            <span>Aggregation</span>
            <Select
                value={fields.aggregate}
                onChange={event => fields.setAggregate(event.target.value as Aggregate)}
            >
                {aggregates.map(item => (
                    <option key={item} value={item}>
                        {AGGREGATE_LABELS[item]}
                    </option>
                ))}
            </Select>
        </label>

        {needsColumn(fields.aggregate) && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Column</span>
                <Select
                    data-testid="primary-measure-select"
                    value={derived.activeMeasureColumnId}
                    onChange={event => fields.setMeasureColumnId(event.target.value)}
                >
                    <AnalysisColumnOptions columns={derived.measureColumns} />
                </Select>
            </label>
        )}

        <label className={styles['control']} data-stack="v" data-gap="xs">
            <span>Value format</span>
            <Select
                value={fields.valueFormat}
                onChange={event =>
                    fields.setValueFormat(event.target.value as MeasureValueFormat)
                }
            >
                {valueFormats.map(item => (
                    <option key={item} value={item}>
                        {VALUE_FORMAT_LABELS[item]}
                    </option>
                ))}
            </Select>
        </label>

        {fields.chartType !== 'pie' && fields.chartType !== 'heatmap' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>2nd measure</span>
                <Select
                    value={fields.secondMeasureEnabled ? 'on' : 'off'}
                    onChange={event =>
                        fields.setSecondMeasureEnabled(event.target.value === 'on')
                    }
                >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                </Select>
            </label>
        )}

        {fields.secondMeasureEnabled &&
            fields.chartType !== 'pie' &&
            fields.chartType !== 'heatmap' && (
                <>
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>2nd aggregation</span>
                        <Select
                            value={fields.secondAggregate}
                            onChange={event =>
                                fields.setSecondAggregate(event.target.value as Aggregate)
                            }
                        >
                            {aggregates.map(item => (
                                <option key={item} value={item}>
                                    {AGGREGATE_LABELS[item]}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>2nd value format</span>
                        <Select
                            value={fields.secondValueFormat}
                            onChange={event =>
                                fields.setSecondValueFormat(
                                    event.target.value as MeasureValueFormat
                                )
                            }
                        >
                            {valueFormats.map(item => (
                                <option key={item} value={item}>
                                    {VALUE_FORMAT_LABELS[item]}
                                </option>
                            ))}
                        </Select>
                    </label>
                    {needsColumn(fields.secondAggregate) && (
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>2nd column</span>
                            <Select
                                data-testid="second-measure-select"
                                value={derived.activeSecondMeasureColumnId}
                                onChange={event =>
                                    fields.setSecondMeasureColumnId(event.target.value)
                                }
                            >
                                <AnalysisColumnOptions
                                    columns={derived.secondMeasureColumns}
                                />
                            </Select>
                        </label>
                    )}
                </>
            )}

        {fields.chartType === 'pie' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Max slices</span>
                <TextInput
                    type="number"
                    min={1}
                    max={50}
                    value={fields.topN}
                    onChange={event =>
                        fields.setTopN(clamp(Number(event.target.value), 1, 50))
                    }
                />
            </label>
        )}
    </>
);
