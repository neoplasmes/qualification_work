type MetricWidgetSize = {
    width: number;
    height: number;
};

type MetricWidgetLayout = {
    showSparklineDescription: boolean;
    useProgressFallback: boolean;
    sparklineHeight: number;
};

const compactDetailsThreshold = 200;
const sparklineHeightThreshold = 140;

export const getMetricWidgetLayout = (size: MetricWidgetSize): MetricWidgetLayout => {
    const hasMeasuredSize = size.width > 0 && size.height > 0;

    return {
        showSparklineDescription:
            !hasMeasuredSize ||
            (size.width >= compactDetailsThreshold &&
                size.height >= compactDetailsThreshold),
        useProgressFallback: hasMeasuredSize && size.height < sparklineHeightThreshold,
        sparklineHeight: hasMeasuredSize
            ? Math.round(Math.min(64, Math.max(28, size.height * 0.24)))
            : 36,
    };
};
