import { formatDate } from '@/shared/lib/formatDate';

import type { Chart, ChartResponse } from '../../api';
import { BAR_CHART_ROWS_LIMIT } from '../../const';
import { getChartColorFromConfig } from '../../lib';
import { ChartConfigSummary } from '../ChartConfigSummary';
import { ChartShell } from '../ChartShell';
import {
    dashboardChartAspectRatioConstraint,
    type ChartFrameHeight,
} from '../ChartShell/lib';

import styles from './ChartCard.module.scss';

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
        barsLimit={BAR_CHART_ROWS_LIMIT}
        chartHeight={chartHeight}
        aspectRatioConstraint={
            constrainAspectRatio ? dashboardChartAspectRatioConstraint : undefined
        }
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
