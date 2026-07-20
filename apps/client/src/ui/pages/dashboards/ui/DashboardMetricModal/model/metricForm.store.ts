import type {
    MetricFormat,
    MetricTargetDirection,
    MetricTimeBucket,
} from '@qualification-work/types';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

/**
 * editable metric form state, '' on target/timeColumn/timeBucket means "none/auto"
 */
export type WorkspaceMetricForm = {
    name: string;
    expression: string;
    format: MetricFormat;
    valueMultiplier: string;
    target: string;
    targetDirection: MetricTargetDirection;
    showTrend: boolean;
    timeColumn: string;
    timeBucket: MetricTimeBucket | '';
};

export type MetricFormState = {
    workspaceMetricName: string;
    workspaceMetricExpression: string;
    workspaceMetricFormat: MetricFormat;
    workspaceMetricValueMultiplier: string;
    workspaceMetricTarget: string;
    workspaceMetricTargetDirection: MetricTargetDirection;
    workspaceMetricShowTrend: boolean;
    workspaceMetricTimeColumn: string;
    workspaceMetricTimeBucket: MetricTimeBucket | '';
};
const emptyMetricExtras = {
    workspaceMetricTarget: '',
    workspaceMetricValueMultiplier: '1',
    workspaceMetricTargetDirection: 'higher',
    workspaceMetricShowTrend: false,
    workspaceMetricTimeColumn: '',
    workspaceMetricTimeBucket: '',
} satisfies Partial<MetricFormState>;

export const metricFormInitialState: MetricFormState = {
    workspaceMetricName: '',
    workspaceMetricExpression: '',
    workspaceMetricFormat: '',
    ...emptyMetricExtras,
};
export function createMetricFormStore(initial: Partial<MetricFormState> = {}) {
    return createStore<
        MetricFormState & {
            clearWorkspaceMetricForm(): void;
            setWorkspaceMetricForm(value: WorkspaceMetricForm): void;
        }
    >()(
        immer(set => ({
            ...metricFormInitialState,
            ...initial,
            clearWorkspaceMetricForm: () =>
                set(state => {
                    state.workspaceMetricName = '';
                    state.workspaceMetricExpression = '';
                    state.workspaceMetricFormat = '';
                    Object.assign(state, emptyMetricExtras);
                }),
            setWorkspaceMetricForm: value =>
                set(state => {
                    state.workspaceMetricName = value.name;
                    state.workspaceMetricExpression = value.expression;
                    state.workspaceMetricFormat = value.format;
                    state.workspaceMetricValueMultiplier = value.valueMultiplier;
                    state.workspaceMetricTarget = value.target;
                    state.workspaceMetricTargetDirection = value.targetDirection;
                    state.workspaceMetricShowTrend = value.showTrend;
                    state.workspaceMetricTimeColumn = value.timeColumn;
                    state.workspaceMetricTimeBucket = value.timeBucket;
                }),
        }))
    );
}
