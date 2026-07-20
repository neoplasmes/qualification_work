import { expect, it } from 'vitest';

import { createMetricFormStore } from './metricForm.store';

it('stores and clears metric form fields', () => {
    let state = (() => {
        const store = createMetricFormStore();
        store.getState().setWorkspaceMetricForm({
            name: 'Average',
            expression: 'avg(score)',
            format: '%',
            valueMultiplier: '100',
            target: '42',
            targetDirection: 'higher',
            showTrend: true,
            timeColumn: 'created_at',
            timeBucket: 'month',
        });

        return store.getState();
    })();

    expect(state.workspaceMetricName).toBe('Average');
    expect(state.workspaceMetricExpression).toBe('avg(score)');
    expect(state.workspaceMetricFormat).toBe('%');
    expect(state.workspaceMetricValueMultiplier).toBe('100');
    expect(state.workspaceMetricTarget).toBe('42');
    expect(state.workspaceMetricShowTrend).toBe(true);
    expect(state.workspaceMetricTimeColumn).toBe('created_at');
    expect(state.workspaceMetricTimeBucket).toBe('month');

    state = (() => {
        const store = createMetricFormStore(state);
        store.getState().clearWorkspaceMetricForm();

        return store.getState();
    })();

    expect(state.workspaceMetricName).toBe('');
    expect(state.workspaceMetricExpression).toBe('');
    expect(state.workspaceMetricFormat).toBe('');
    expect(state.workspaceMetricValueMultiplier).toBe('1');
    expect(state.workspaceMetricTarget).toBe('');
    expect(state.workspaceMetricShowTrend).toBe(false);
    expect(state.workspaceMetricTimeColumn).toBe('');
    expect(state.workspaceMetricTimeBucket).toBe('');
});
