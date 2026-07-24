import { LegendOrdinal } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';

import type { ChartSeries } from '../../lib/parseChartData';
import { getSeriesColor } from './lineChartConfig';

import styles from './LineChart.module.css';

type LineChartLegendProps = {
    series: ChartSeries[];
    color: string;
};

export const LineChartLegend = ({ series, color }: LineChartLegendProps) => {
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
                    data-testid="line-chart-legend"
                    data-gap="sm"
                >
                    {labels.map((label, index) => (
                        <div
                            key={label.text}
                            className={styles['legend-item']}
                            data-stack="h"
                            data-gap="xs"
                            title={label.text}
                        >
                            <span
                                className={styles['legend-swatch']}
                                style={{
                                    borderTop: `2px ${index % 2 ? 'dashed' : 'solid'} ${label.value}`,
                                    backgroundColor: 'transparent',
                                }}
                            />
                            <span className={styles['legend-label']}>{label.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </LegendOrdinal>
    );
};
