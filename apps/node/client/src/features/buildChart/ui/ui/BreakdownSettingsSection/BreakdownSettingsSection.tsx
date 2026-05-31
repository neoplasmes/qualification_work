import { Select, Switch, TextInput } from '@/shared/ui';

import type { ChartBuilderDerivedState, ChartBuilderState } from '../../../model';

import { AnalysisColumnOptions } from '../AnalysisColumnOptions';

import styles from '../../DatasetChartBuilder.module.scss';

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

type BreakdownSettingsSectionProps = {
    derived: ChartBuilderDerivedState;
    fields: ChartBuilderState;
};

export const BreakdownSettingsSection = ({
    derived,
    fields,
}: BreakdownSettingsSectionProps) => (
    <>
        {fields.chartType !== 'pie' && fields.chartType !== 'heatmap' && (
            <div
                className={styles['section']}
                data-stack="h"
                data-gap="sm"
                data-align="center"
            >
                <span>Breakdown</span>
                <Switch
                    aria-label="Enable breakdown"
                    checked={fields.seriesEnabled}
                    onChange={event => fields.setSeriesEnabled(event.target.checked)}
                />
            </div>
        )}

        {fields.seriesEnabled &&
            fields.chartType !== 'pie' &&
            fields.chartType !== 'heatmap' && (
                <>
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Split by</span>
                        <Select
                            value={derived.activeSeriesColumnId}
                            onChange={event =>
                                fields.setSeriesColumnId(event.target.value)
                            }
                        >
                            <AnalysisColumnOptions columns={derived.columns} />
                        </Select>
                    </label>
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Max categories</span>
                        <TextInput
                            type="number"
                            min={1}
                            max={50}
                            value={fields.seriesTopN}
                            onChange={event =>
                                fields.setSeriesTopN(
                                    clamp(Number(event.target.value), 1, 50)
                                )
                            }
                        />
                    </label>
                    {fields.chartType === 'bar' && (
                        <label className={styles['control']} data-stack="v" data-gap="xs">
                            <span>Group others</span>
                            <Select
                                value={fields.seriesOtherBucket ? 'on' : 'off'}
                                onChange={event =>
                                    fields.setSeriesOtherBucket(
                                        event.target.value === 'on'
                                    )
                                }
                            >
                                <option value="on">On</option>
                                <option value="off">Off</option>
                            </Select>
                        </label>
                    )}
                </>
            )}
    </>
);
