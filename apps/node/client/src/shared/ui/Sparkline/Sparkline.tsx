import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';

import { useRafElementSize } from '@/shared/lib/useRafElementSize';

type SparklineProps = {
    values: number[];
    height?: number;
    color?: string;
    insetX?: number;
    insetY?: number;
    strokeWidth?: number;
    className?: string;
};

/**
 * tiny no-axis line over a numeric series, fills the parent width
 * renders nothing for fewer than two points
 */
export const Sparkline = ({
    values,
    height = 28,
    color = 'currentColor',
    insetX = 0,
    insetY = 2,
    strokeWidth = 1.5,
    className,
}: SparklineProps) => {
    const { ref, size } = useRafElementSize({ ignoreHeight: true });
    const { width } = size;

    if (values.length < 2) {
        return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    let content = null;

    if (width > 0) {
        const xInset = Math.min(insetX, Math.max(0, (width - 2) / 2));
        const yInset = Math.min(insetY, Math.max(0, (height - 2) / 2));
        const x = scaleLinear({
            domain: [0, values.length - 1],
            range: [xInset + 1, width - xInset - 1],
        });
        const y = scaleLinear({
            domain: [min, max === min ? min + 1 : max],
            range: [height - yInset - 1, yInset + 1],
        });

        content = (
            <svg width={width} height={height} aria-hidden>
                <LinePath<number>
                    data={values}
                    x={(_, index) => x(index)}
                    y={value => y(value)}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
            </svg>
        );
    }

    return (
        <div ref={ref} className={className} style={{ width: '100%', height }}>
            {content}
        </div>
    );
};
