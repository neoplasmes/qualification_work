import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';

type SparklineProps = {
    values: number[];
    height?: number;
    color?: string;
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
    className,
}: SparklineProps) => {
    if (values.length < 2) {
        return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    return (
        <div className={className} style={{ width: '100%', height }}>
            <ParentSize>
                {({ width }) => {
                    if (width <= 0) {
                        return null;
                    }

                    const x = scaleLinear({
                        domain: [0, values.length - 1],
                        range: [1, width - 1],
                    });
                    const y = scaleLinear({
                        domain: [min, max === min ? min + 1 : max],
                        range: [height - 2, 2],
                    });

                    return (
                        <svg width={width} height={height} aria-hidden>
                            <LinePath<number>
                                data={values}
                                x={(_, index) => x(index)}
                                y={value => y(value)}
                                stroke={color}
                                strokeWidth={1.5}
                                fill="none"
                            />
                        </svg>
                    );
                }}
            </ParentSize>
        </div>
    );
};
