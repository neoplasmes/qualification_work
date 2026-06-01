import { Plus, X } from 'lucide-react';
import { Fragment } from 'react';

import { AGGREGATE_LABELS, VALUE_FORMAT_LABELS } from '@/entities/chart';

import { Button, IconButton, Select, TextInput } from '@/shared/ui';

import type { Aggregate, MeasureValueFormat } from '../../../api';
import { aggregates, valueFormats } from '../../../const';
import { MAX_MEASURES, needsColumn } from '../../../lib';
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
}: MeasureSettingsSectionProps) => {
    const singleMeasure = fields.chartType === 'pie' || fields.chartType === 'heatmap';
    const measures = singleMeasure ? fields.measures.slice(0, 1) : fields.measures;
    const canAddMeasure = !singleMeasure && fields.measures.length < MAX_MEASURES;
    const canRemoveMeasure = !singleMeasure && fields.measures.length > 1;

    return (
        <>
            {measures.map((measure, index) => (
                <Fragment key={index}>
                    <div
                        className={styles['section']}
                        data-stack="h"
                        data-gap="xs"
                        data-align="center"
                    >
                        <span>{singleMeasure ? 'Value' : `Y value ${index + 1}`}</span>
                        {canRemoveMeasure && (
                            <IconButton
                                tone="nav"
                                className={styles['remove-measure']}
                                aria-label={`Remove Y value ${index + 1}`}
                                onClick={() => fields.removeMeasure(index)}
                            >
                                <X size={14} />
                            </IconButton>
                        )}
                    </div>

                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Aggregation</span>
                        <Select
                            value={measure.aggregate}
                            onChange={event =>
                                fields.setMeasureAggregate(
                                    index,
                                    event.target.value as Aggregate
                                )
                            }
                        >
                            {aggregates.map(item => (
                                <option key={item} value={item}>
                                    {AGGREGATE_LABELS[item]}
                                </option>
                            ))}
                        </Select>
                    </label>

                    {needsColumn(measure.aggregate) && (
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Column</span>
                            <Select
                                data-testid={
                                    index === 0
                                        ? 'primary-measure-select'
                                        : `measure-select-${index}`
                                }
                                value={derived.measures[index]?.activeColumnId ?? ''}
                                onChange={event =>
                                    fields.setMeasureColumnId(index, event.target.value)
                                }
                            >
                                <AnalysisColumnOptions
                                    columns={derived.measures[index]?.columns ?? []}
                                />
                            </Select>
                        </label>
                    )}

                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Value format</span>
                        <Select
                            value={measure.valueFormat}
                            onChange={event =>
                                fields.setMeasureValueFormat(
                                    index,
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
                </Fragment>
            ))}

            {canAddMeasure && (
                <Button
                    tone="ghost"
                    className={styles['add-measure']}
                    data-pl="none"
                    onClick={fields.addMeasure}
                >
                    <Plus size={16} />
                    Add measure
                </Button>
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
};
