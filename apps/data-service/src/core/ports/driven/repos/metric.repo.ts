import type { MetricTimeBucket } from '@qualification-work/types';
import type {
    MetricAggTerm,
    MetricTermKey,
} from '@qualification-work/microservice-utils/metricExpression';

export type MetricColumnMeta = {
    dataType: string;
    isAnalyzable: boolean;
};

export type MetricDataset = {
    id: string;
    orgId: string;
    columns: Map<string, MetricColumnMeta>;
    firstDateColumn: string | null;
};

export type MetricTrendBucket = {
    bucket: string;
    values: Map<MetricTermKey, number | null>;
};

/**
 * aggregate scans over dataset rows used by metric cards
 */
export interface MetricRepo {
    /**
     * loads datasets with their columns in one round trip
     *
     * @param datasetIds
     * @returns
     */
    findDatasets(datasetIds: string[]): Promise<Map<string, MetricDataset>>;

    /**
     * computes every term over the whole dataset in one scan
     *
     * @param datasetId
     * @param terms
     * @returns null values when a stored value cannot be aggregated
     */
    computeScalars(
        datasetId: string,
        terms: MetricAggTerm[]
    ): Promise<Map<MetricTermKey, number | null>>;

    /**
     * computes terms per time bucket in one grouped scan
     *
     * @param datasetId
     * @param timeColumn
     * @param bucket
     * @param terms
     * @returns buckets in time order, null when dates cannot be parsed
     */
    computeTrend(
        datasetId: string,
        timeColumn: string,
        bucket: MetricTimeBucket,
        terms: MetricAggTerm[]
    ): Promise<MetricTrendBucket[] | null>;
}
