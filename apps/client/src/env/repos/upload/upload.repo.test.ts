import { UploadRegistry } from '@/env/tools/uploadRegistry';
import { HttpTransport } from '@/env/transport/http';
import { commitFixture, previewFixture } from '@/test/uploadFixtures';
import { expect, it, vi } from 'vitest';

import { HttpUploadRepo } from './upload.repo';

it('sends original files as repeated multipart fields and keeps optional query semantics', async () => {
    const registry = new UploadRegistry();
    const originals = [new File(['one'], 'one.csv'), new File(['two'], 'two.xlsx')];
    const files = registry.register(originals);
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValue(Response.json(previewFixture));
    const repo = new HttpUploadRepo(
        new HttpTransport({ baseUrl: '/api', fetch }),
        registry.resolve
    );
    expect(registry.resolve(files[0]!)).toBe(originals[0]);
    await repo.previewDatasetMerge({
        orgId: 'org /1',
        files,
        mergeKeys: ['a', 'b'],
        mode: 'append',
        createNew: true,
        name: 'new',
    });
    const [url, init] = fetch.mock.calls[0]!;
    const params = new URL(String(url), 'http://localhost').searchParams;
    expect(params.get('orgId')).toBe('org /1');
    expect(params.get('mergeKeys')).toBe('a,b');
    expect(params.get('createNew')).toBe('true');
    expect(params.has('datasetId')).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
    expect(
        (init!.body as FormData).getAll('file').map(file => (file as File).name)
    ).toEqual(['one.csv', 'two.xlsx']);
    expect(new Headers(init?.headers).has('content-type')).toBe(false);
    registry.release(files);
    expect(() => registry.resolve(files[0]!)).toThrow();
});

it('uploads one file and uses encoded session and org for commit and cancel', async () => {
    const registry = new UploadRegistry();
    const [file] = registry.register([new File(['a'], 'a.csv')]);
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(Response.json({ id: 'created' }))
        .mockResolvedValueOnce(Response.json(commitFixture))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const repo = new HttpUploadRepo(
        new HttpTransport({ baseUrl: '/api', fetch }),
        registry.resolve
    );
    expect(await repo.uploadDataset({ orgId: 'org/1', file: file! })).toEqual({
        id: 'created',
    });
    expect((fetch.mock.calls[0]![1]!.body as FormData).getAll('file')).toHaveLength(1);
    expect(
        await repo.commitDatasetMerge({ orgId: 'org/1', sessionId: 'session /1' })
    ).toEqual(commitFixture);
    await repo.cancelDatasetMerge({ orgId: 'org/1', sessionId: 'session /1' });
    expect(fetch.mock.calls[1]![0]).toBe(
        '/api/data/datasets/merge/session%20%2F1/commit?orgId=org%2F1'
    );
    expect(fetch.mock.calls[2]![0]).toBe(
        '/api/data/datasets/merge/session%20%2F1?orgId=org%2F1'
    );
    expect(fetch.mock.calls[1]![1]?.body).toBeUndefined();
});

it('rejects malformed results and never retries an uncertain commit', async () => {
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(Response.json({ sessionId: 'missing-statistics' }))
        .mockRejectedValueOnce(new TypeError('offline'));
    const repo = new HttpUploadRepo(
        new HttpTransport({ baseUrl: '/api', fetch }),
        () => new File([], 'a.csv')
    );
    await expect(
        repo.previewDatasetMerge({ orgId: 'org', files: [], mergeKeys: [] })
    ).rejects.toThrow();
    await expect(
        repo.commitDatasetMerge({ orgId: 'org', sessionId: 'session' })
    ).rejects.toThrow();
    expect(
        fetch.mock.calls.filter(([url]) => String(url).includes('/commit'))
    ).toHaveLength(1);
});
