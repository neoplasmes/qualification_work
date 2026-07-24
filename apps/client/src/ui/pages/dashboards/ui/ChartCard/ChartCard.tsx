import type { Chart, ChartData as ChartResponse } from '@/core/entities/chart';
import { ChartConfigSummary } from '@/ui/widgets/ChartConfigSummary';
import {
    barChartRowsLimit,
    ChartShell,
    dashboardChartAspectRatioConstraint,
    dashboardLineChartAspectRatioConstraint,
    getChartColorFromConfig,
    type ChartAspectRatioConstraint,
    type ChartFrameHeight,
} from '@/ui/widgets/ChartShell';

import { formatDate } from '@/shared/lib/formatDate';

import styles from './ChartCard.module.css';

type ChartCardColumn = {
    id: string;
    displayName: string;
};

type ChartCardProps = {
    chart?: Chart;
    columns: readonly ChartCardColumn[];
    data: ChartResponse;
    ariaLabel: string;
    chartHeight?: ChartFrameHeight;
    descriptionSize?: 'default' | 'small';
    showAxisTickLabels?: boolean;
    showDescription?: boolean;
    showLegend?: boolean;
    constrainAspectRatio?: boolean;
    transparentBackground?: boolean;
};

const getChartCardAspectRatioConstraint = (
    kind: ChartResponse['kind'],
    constrainAspectRatio: boolean
): ChartAspectRatioConstraint | undefined => {
    if (!constrainAspectRatio) {
        return undefined;
    }

    return kind === 'line'
        ? dashboardLineChartAspectRatioConstraint
        : dashboardChartAspectRatioConstraint;
};

export const ChartCard = ({
    chart,
    columns,
    data,
    ariaLabel,
    chartHeight,
    descriptionSize = 'default',
    showAxisTickLabels = true,
    showDescription = true,
    showLegend = true,
    constrainAspectRatio = false,
    transparentBackground = false,
}: ChartCardProps) => (
    <ChartShell
        data={data}
        kind={data.kind}
        ariaLabel={ariaLabel}
        color={chart ? getChartColorFromConfig(chart.config) : undefined}
        barsLimit={barChartRowsLimit}
        chartHeight={chartHeight}
        aspectRatioConstraint={getChartCardAspectRatioConstraint(
            data.kind,
            constrainAspectRatio
        )}
        showAxisTickLabels={showAxisTickLabels}
        showResultSummary={false}
        showLegend={showLegend}
        transparentBackground={transparentBackground}
    >
        {chart && showDescription && (
            <div className={styles['description']} data-stack="v" data-gap="xs">
                <ChartConfigSummary
                    chartType={chart.chartType}
                    config={chart.config}
                    columns={columns}
                    size={descriptionSize}
                    className={styles['description-summary']}
                />
                <span
                    className={[
                        styles['aggregated-at'],
                        descriptionSize === 'small' ? styles['aggregated-at-small'] : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    Aggregated at {formatDate(data.aggregatedAt)}
                </span>
            </div>
        )}
    </ChartShell>
);
