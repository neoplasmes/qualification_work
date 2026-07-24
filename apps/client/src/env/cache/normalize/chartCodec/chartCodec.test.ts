import { chartCodec, chartListCodec } from '.';
import type { Chart } from '@/core/entities/chart';
import { createCacheHarness } from '@/test/cacheFixtures';
import { expect, it } from 'vitest';

it('shares clean canonical chart projection and preserves opaque config JSON', async () => {
    const { store } = createCacheHarness();
    const chart: Chart = {
        ref: 'chart:org/chart',
        id: 'chart',
        orgId: 'org',
        datasetId: 'dataset',
        name: 'initial',
        chartType: 'bar',
        config: {
            kind: 'bar',
            dimension: { columnId: 'column' },
            measures: [{ aggregate: 'count' }],
            filters: [
                {
                    columnId: 'column',
                    op: 'eq',
                    value: { id: 'opaque', ref: 'chart:fake', kind: 'ref' },
                },
            ],
        },
        createdAt: '',
        updatedAt: '',
    };
    const detail = await chartCodec.normalize(chart, undefined, store);
    const list = await chartListCodec.normalize([chart], undefined, store);
    expect(chartListCodec.resolve(list, store)[0]).toBe(
        chartCodec.resolve(detail, store)
    );
    expect(chartCodec.resolve(detail, store)).toEqual(chart);
    expect([...store.keys()]).toEqual([chart.ref]);
    await store.upsert(chart.ref, { name: 'renamed' });
    expect(chartCodec.resolve(detail, store).name).toBe('renamed');
    expect(chartListCodec.resolve(list, store)[0]?.config).toEqual(chart.config);
    await store.dispose();
});
