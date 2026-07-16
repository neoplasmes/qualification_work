import { datasetFixture } from '@/test/cacheFixtures';
import { commandPolicy, createCommand } from '@/test/commandFixtures';
import { createReadHarness, datasetCodec, deferred } from '@/test/readFixtures';
import { expect, it, vi } from 'vitest';

it('executes a void command exactly once', async () => {
    const { runtime } = createReadHarness();
    const command = createCommand(vi.fn(async () => undefined));
    runtime.registerCommand(command, commandPolicy());
    expect(await runtime.execute(command, undefined)).toBeUndefined();
    expect(command.execute).toHaveBeenCalledTimes(1);
    await runtime.dispose();
});

it('serializes conflicting writes and runs unrelated keys in parallel', async () => {
    const { runtime } = createReadHarness();
    const first = deferred<string>();
    const calls: string[] = [];
    const command = createCommand(async (input: string) => {
        calls.push(input);

        return input === 'first' ? first.promise : input;
    });
    runtime.registerCommand(command, {
        ...commandPolicy(),
        conflictKey: input => (input === 'other' ? 'other' : 'shared'),
    });
    const a = runtime.execute(command, 'first');
    const b = runtime.execute(command, 'second');
    const c = runtime.execute(command, 'other');
    await expect(c).resolves.toBe('other');
    expect(calls).toEqual(['first', 'other']);
    first.resolve('first');
    await expect(a).resolves.toBe('first');
    await expect(b).resolves.toBe('second');
    expect(calls).toEqual(['first', 'other', 'second']);
    await runtime.dispose();
});

it('retires queued writes and ignores completion from a cleared session', async () => {
    const { runtime, store } = createReadHarness();
    const response = deferred<typeof datasetFixture>();
    const command = createCommand(vi.fn(() => response.promise));
    runtime.registerCommand(command, { ...commandPolicy(), codec: datasetCodec });
    const first = runtime.execute(command, undefined).catch(error => error);
    const queued = runtime.execute(command, undefined).catch(error => error);
    await vi.waitFor(() => expect(command.execute).toHaveBeenCalledTimes(1));
    await runtime.clear();
    await store.upsert(datasetFixture.ref, { ...datasetFixture, name: 'new session' });
    response.resolve(datasetFixture);
    expect(await first).toMatchObject({ name: 'AbortError' });
    expect(await queued).toMatchObject({ name: 'AbortError' });
    expect(command.execute).toHaveBeenCalledTimes(1);
    expect(store.get(datasetFixture.ref)?.name).toBe('new session');
    await runtime.dispose();
});

it('holds new reads until confirmed ingestion and releases before refetch', async () => {
    const read = vi.fn(async () => datasetFixture);
    const { runtime, query } = createReadHarness(read);
    const response = deferred<void>();
    const command = createCommand(vi.fn(() => response.promise));
    runtime.registerCommand(command, commandPolicy());
    const write = runtime.execute(command, undefined);
    await vi.waitFor(() => expect(command.execute).toHaveBeenCalledTimes(1));
    const result = runtime.read(query, undefined);
    await Promise.resolve();
    expect(read).not.toHaveBeenCalled();
    response.resolve();
    await write;
    await expect(result).resolves.toEqual(datasetFixture);
    await runtime.dispose();
});

it('does not publish partial normalization after confirmed success', async () => {
    const { runtime, store } = createReadHarness();
    const command = createCommand(async () => datasetFixture);
    const failure = new Error('invalid output');
    runtime.registerCommand(command, {
        ...commandPolicy(),
        codec: {
            ...datasetCodec,
            async normalize(output, _input, staging) {
                await staging.upsert(output.ref, output);

                throw failure;
            },
        },
    });
    expect(await runtime.runCommand(command, undefined)).toEqual({
        data: datasetFixture,
        syncError: failure,
    });
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    await runtime.dispose();
});

it('removes only confirmed deletions and fences obsolete reads', async () => {
    const old = deferred<typeof datasetFixture>();
    const { runtime, query, store } = createReadHarness(() => old.promise);
    await store.upsert(datasetFixture.ref, datasetFixture);
    const read = runtime.read(query, undefined).catch(error => error);
    const command = createCommand(async () => undefined);
    runtime.registerCommand(command, {
        ...commandPolicy(),
        removals: () => [datasetFixture.ref],
    });
    await runtime.execute(command, undefined);
    old.resolve(datasetFixture);
    await read;
    expect(store.get(datasetFixture.ref)).toBeUndefined();
    expect(runtime.tombstones.has(datasetFixture.ref)).toBe(true);
    await runtime.dispose();
});

it('starts new-session writes without waiting for a retired queue', async () => {
    const { runtime } = createReadHarness();
    const old = deferred<string>();
    const command = createCommand(
        vi.fn(async (input: string) => (input === 'old' ? old.promise : input))
    );
    runtime.registerCommand(command, commandPolicy());
    const retired = runtime.execute(command, 'old').catch(error => error);
    await vi.waitFor(() => expect(command.execute).toHaveBeenCalledTimes(1));
    await runtime.clear();
    expect(await runtime.execute(command, 'new')).toBe('new');
    old.resolve('old');
    expect(await retired).toMatchObject({ name: 'AbortError' });
    await runtime.dispose();
});

it('recovers a serialization queue after a rejected command', async () => {
    const { runtime } = createReadHarness();
    const command = createCommand(async (input: string) => {
        if (input === 'bad') {
            throw new Error('rejected');
        }

        return input;
    });
    runtime.registerCommand(command, commandPolicy());
    const first = runtime.execute(command, 'bad').catch(error => error);
    const second = runtime.execute(command, 'good');
    expect(await first).toMatchObject({ message: 'rejected' });
    expect(await second).toBe('good');
    await runtime.dispose();
});

it('fences a read paused inside normalization before publication', async () => {
    const { runtime, store } = createReadHarness();
    const pause = deferred<void>();
    const staged = deferred<void>();
    const query = {
        name: 'slowCodec',
        reads: () => [datasetFixture.ref],
        execute: async () => datasetFixture,
    };
    runtime.registerRead(query, {
        ...datasetCodec,
        async normalize(output, _input, staging) {
            const result = await datasetCodec.normalize(output, undefined, staging);
            staged.resolve();
            await pause.promise;

            return result;
        },
    });
    const old = runtime.read(query, undefined).catch(error => error);
    await staged.promise;
    const command = createCommand(async () => ({ ...datasetFixture, name: 'confirmed' }));
    runtime.registerCommand(command, { ...commandPolicy(), codec: datasetCodec });
    await runtime.execute(command, undefined);
    pause.resolve();
    await old;
    await Promise.resolve();
    expect(store.get(datasetFixture.ref)?.name).toBe('confirmed');
    await runtime.dispose();
});

it('rejects a command paused in normalization across clear', async () => {
    const { runtime, store } = createReadHarness();
    const pause = deferred<void>();
    const staged = deferred<void>();
    const command = createCommand(async () => datasetFixture);
    runtime.registerCommand(command, {
        ...commandPolicy(),
        codec: {
            ...datasetCodec,
            async normalize(output, _input, staging) {
                const result = await datasetCodec.normalize(output, undefined, staging);
                staged.resolve();
                await pause.promise;

                return result;
            },
        },
    });
    const old = runtime.execute(command, undefined).catch(error => error);
    await staged.promise;
    await runtime.clear();
    await store.upsert(datasetFixture.ref, { ...datasetFixture, name: 'current' });
    pause.resolve();
    expect(await old).toMatchObject({ name: 'AbortError' });
    expect(store.get(datasetFixture.ref)?.name).toBe('current');
    await runtime.dispose();
});

it('requires explicit registration and rejects duplicate policies', async () => {
    const { runtime } = createReadHarness();
    const command = createCommand(vi.fn(async () => undefined));
    await expect(runtime.execute(command, undefined)).rejects.toThrow(
        'Unregistered command'
    );
    expect(command.execute).not.toHaveBeenCalled();
    runtime.registerCommand(command, commandPolicy());
    expect(() => runtime.registerCommand(command, commandPolicy())).toThrow(
        'already registered'
    );
    await runtime.dispose();
});

it('preserves a confirmed result when removal preparation fails', async () => {
    const { runtime, store } = createReadHarness();
    await store.upsert(datasetFixture.ref, datasetFixture);
    const command = createCommand(async () => 'deleted');
    const failure = new Error('invalid removal mapping');
    runtime.registerCommand(command, {
        ...commandPolicy(),
        removals() {
            throw failure;
        },
    });
    expect(await runtime.runCommand(command, undefined)).toEqual({
        data: 'deleted',
        syncError: failure,
    });
    expect(store.get(datasetFixture.ref)?.name).toBe('dataset');
    expect(runtime.tombstones.size).toBe(0);
    await runtime.dispose();
});
