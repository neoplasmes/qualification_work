import { GRANULARITY_LABELS } from '@/entities/chart';

import { Select, TextInput } from '@/shared/ui';

import type { TimeGranularity } from '../../../api';
import { groupingLabels, timeGranularities } from '../../../const';
import type { ChartBuilderDerivedState, ChartBuilderState } from '../../../model';
import type { GroupingMode } from '../../../types';

import { AnalysisColumnOptions } from '../AnalysisColumnOptions';

import styles from '../../DatasetChartBuilder.module.scss';

type AxisSettingsSectionProps = {
    derived: ChartBuilderDerivedState;
    fields: ChartBuilderState;
    onDimensionColumnChange: (columnId: string) => void;
    onHeatmapYColumnChange: (columnId: string) => void;
};

export const AxisSettingsSection = ({
    derived,
    fields,
    onDimensionColumnChange,
    onHeatmapYColumnChange,
}: AxisSettingsSectionProps) => (
    <>
        <label className={styles['control']} data-stack="v" data-gap="xs">
            <span>{fields.chartType === 'pie' ? 'Slice by' : 'X axis'}</span>
            <Select
                value={derived.activeDimensionColumnId}
                onChange={event => onDimensionColumnChange(event.target.value)}
            >
                <AnalysisColumnOptions columns={derived.columns} />
            </Select>
        </label>

        {fields.chartType === 'heatmap' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Y axis</span>
                <Select
                    value={derived.activeHeatmapYColumnId}
                    onChange={event => onHeatmapYColumnChange(event.target.value)}
                >
                    <AnalysisColumnOptions columns={derived.columns} />
                </Select>
            </label>
        )}

        <label className={styles['control']} data-stack="v" data-gap="xs">
            <span>{fields.chartType === 'heatmap' ? 'Group X by' : 'Group by'}</span>
            <Select
                value={
                    derived.dimGroupingModes.includes(fields.dimensionGroupingMode)
                        ? fields.dimensionGroupingMode
                        : 'none'
                }
                disabled={derived.dimGroupingModes.length === 1}
                onChange={event =>
                    fields.setDimensionGroupingMode(event.target.value as GroupingMode)
                }
            >
                {derived.dimGroupingModes.map(mode => (
                    <option key={mode} value={mode}>
                        {groupingLabels[mode]}
                    </option>
                ))}
            </Select>
        </label>

        {fields.dimensionGroupingMode === 'time' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Time unit</span>
                <Select
                    value={fields.dimensionGranularity}
                    onChange={event =>
                        fields.setDimensionGranularity(
                            event.target.value as TimeGranularity
                        )
                    }
                >
                    {timeGranularities.map(item => (
                        <option key={item} value={item}>
                            {GRANULARITY_LABELS[item]}
                        </option>
                    ))}
                </Select>
            </label>
        )}

        {fields.dimensionGroupingMode === 'numeric' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Bucket size</span>
                <TextInput
                    type="number"
                    min={1}
                    value={fields.dimensionStep}
                    onChange={event =>
                        fields.setDimensionStep(Math.max(1, Number(event.target.value)))
                    }
                />
            </label>
        )}

        {fields.chartType === 'heatmap' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Group Y by</span>
                <Select
                    value={
                        derived.heatmapYGroupingModes.includes(
                            fields.heatmapYGroupingMode
                        )
                            ? fields.heatmapYGroupingMode
                            : 'none'
                    }
                    disabled={derived.heatmapYGroupingModes.length === 1}
                    onChange={event =>
                        fields.setHeatmapYGroupingMode(event.target.value as GroupingMode)
                    }
                >
                    {derived.heatmapYGroupingModes.map(mode => (
                        <option key={mode} value={mode}>
                            {groupingLabels[mode]}
                        </option>
                    ))}
                </Select>
            </label>
        )}

        {fields.chartType === 'heatmap' && fields.heatmapYGroupingMode === 'time' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Y time unit</span>
                <Select
                    value={fields.heatmapYGranularity}
                    onChange={event =>
                        fields.setHeatmapYGranularity(
                            event.target.value as TimeGranularity
                        )
                    }
                >
                    {timeGranularities.map(item => (
                        <option key={item} value={item}>
                            {GRANULARITY_LABELS[item]}
                        </option>
                    ))}
                </Select>
            </label>
        )}

        {fields.chartType === 'heatmap' && fields.heatmapYGroupingMode === 'numeric' && (
            <label className={styles['control']} data-stack="v" data-gap="xs">
                <span>Y bucket size</span>
                <TextInput
                    type="number"
                    min={1}
                    value={fields.heatmapYStep}
                    onChange={event =>
                        fields.setHeatmapYStep(Math.max(1, Number(event.target.value)))
                    }
                />
            </label>
        )}
    </>
);
