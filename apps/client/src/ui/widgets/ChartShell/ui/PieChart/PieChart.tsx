import {
    defaultChartColor,
    getChartFrameStyle,
    getResolvedChartFrameHeight,
    useRafChartSize,
    type ChartDataPoint,
    type ChartFrameHeight,
} from '../../lib';
import { PieChartInner } from './PieChartInner';

type PieChartProps = {
    data: ChartDataPoint[];
    color?: string;
    height?: ChartFrameHeight;
};

export const PieChart = ({ data, color = defaultChartColor, height }: PieChartProps) => {
    const { ref, width, height: measuredHeight } = useRafChartSize();
    const chartHeight = getResolvedChartFrameHeight(height, measuredHeight);

    let content = null;
    if (width > 0 && chartHeight > 0) {
        content = (
            <PieChartInner data={data} color={color} width={width} height={chartHeight} />
        );
    }

    return (
        <div ref={ref} style={getChartFrameStyle(height)}>
            {content}
        </div>
    );
};
