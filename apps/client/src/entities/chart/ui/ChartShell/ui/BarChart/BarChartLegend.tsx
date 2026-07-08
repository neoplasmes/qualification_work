import { LegendOrdinal } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';

import type { ChartSeries } from '../../../../lib/parseChartData';

import { getSeriesColor } from './barChartConfig';

import styles from './BarChart.module.scss';

type BarChartLegendProps = {
    series: ChartSeries[];
    color: string;
};

export const BarChartLegend = ({ series, color }: BarChartLegendProps) => {
    if (series.length < 2) {
        return null;
    }

    const names = series.map(item => item.name);
    const colors = series.map((_, index) => getSeriesColor(color, index));
    const scale = scaleOrdinal<string, string>({ domain: names, range: colors });

    return (
        <LegendOrdinal scale={scale}>
            {labels => (
                <div
                    className={styles['legend']}
                    data-testid="bar-chart-legend"
                    data-gap="sm"
                >
                    {labels.map(label => (
                        <div
                            key={label.text}
                            className={styles['legend-item']}
                            data-stack="h"
                            data-gap="xs"
                            title={label.text}
                        >
                            <span
                                className={styles['legend-swatch']}
                                style={{ backgroundColor: label.value }}
                            />
                            <span className={styles['legend-label']}>{label.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </LegendOrdinal>
    );
};
