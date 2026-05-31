import { formatChartCell } from '../../../lib/formatChartCell';
import type { ChartDataPoint, ChartSeries } from '../../../lib/parseChartData';

const positiveDeltaColor = '#58c4a7';
const negativeDeltaColor = '#c85080';

export const getPreviousPoint = (
    series: ChartSeries[],
    seriesName: string,
    datum: ChartDataPoint
) => {
    const points = series.find(item => item.name === seriesName)?.points ?? [];
    const index = points.findIndex(point => point.label === datum.label);

    return index > 0 ? points[index - 1] : null;
};

export const formatDelta = (datum: ChartDataPoint, previous: ChartDataPoint | null) => {
    if (!previous || previous.value === 0) {
        return null;
    }

    const delta = (datum.value - previous.value) / Math.abs(previous.value);
    const pct = Math.round(delta * 100);

    return {
        text: `(${pct > 0 ? '+' : ''}${pct}%)`,
        tone: pct >= 0 ? positiveDeltaColor : negativeDeltaColor,
    };
};

export const formatTooltipValue = (datum: ChartDataPoint) =>
    formatChartCell(datum.value, { valueFormat: datum.valueFormat });
