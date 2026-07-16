import type { EntityRef } from '@/core/entities/entityRef';
import {
    hashKey,
    QueryObserver,
    type Query as CachedQuery,
    type QueryClient,
} from '@tanstack/react-query';

import type { Command } from '@/app/commands/command';
import type { ReadOptions } from '@/app/ports/repos/readOptions';
import type { Query } from '@/app/queries/query';

import { CommandRunner, type CommandOutcome, type CommandPolicy } from '../commandPolicy';
import type { EntityStore, RecordRef } from '../entityStore';
import { GarbageCollector } from '../garbageCollector';
import { CacheInvalidator } from '../invalidator';
import {
    compositionRefs,
    MissingEntityError,
    ProjectionStore,
    ReadStagingStore,
    type NormalizedResult,
    type ReadCodec,
} from '../normalize';
import { queryOptionsFor } from '../queryOptionsFor';
import { ReadRegistry, type ReadPolicy } from '../register';

export class CacheRuntime {
    epoch = 0;
    readonly registry = new ReadRegistry();
    readonly tombstones = new Set<RecordRef>();
    readonly projections: ProjectionStore;
    readonly garbageCollector: GarbageCollector;
    readonly invalidator: CacheInvalidator;
    private readonly generations = new Map<EntityRef, number>();
    private readonly leases = new Map<string, Set<Set<RecordRef>>>();
    private readonly transientLeases = new Set<Set<RecordRef>>();
    private readonly waiters = new Set<() => void>();
    private readonly resolved = new WeakMap<
        NormalizedResult,
        { rows: unknown[]; output: unknown }
    >();
    private readonly unsubscribe: () => void;
    private disposed = false;
    clearing?: Promise<void>;
    readonly commands = new CommandRunner(this);
    private cleanup?: Promise<void>;

    constructor(
        readonly queryClient: QueryClient,
        readonly store: EntityStore
    ) {
        this.projections = new ProjectionStore(store, this.tombstones);
        this.invalidator = new CacheInvalidator(this);
        this.garbageCollector = new GarbageCollector(store, () => {
            const refs = new Set<RecordRef>();
            for (const query of queryClient.getQueryCache().getAll()) {
                if (query.meta?.normalizedRead === true && query.state.data) {
                    for (const ref of compositionRefs(
                        query.state.data as NormalizedResult,
                        this.store
                    )) {
                        refs.add(ref);
                    }
                }
            }
            for (const leases of this.leases.values()) {
                for (const lease of leases) {
                    for (const ref of lease) {
                        refs.add(ref);
                    }
                }
            }

            for (const lease of this.transientLeases) {
                for (const ref of lease) {
                    refs.add(ref);
                }
            }

            return refs;
        });
        this.unsubscribe = queryClient.getQueryCache().subscribe(event => {
            if (event.query.meta?.normalizedRead !== true) {
                return;
            }
            if (
                event.type === 'removed' ||
                (event.type === 'updated' && event.query.state.fetchStatus === 'idle')
            ) {
                this.leases.delete(event.query.queryHash);
                this.garbageCollector.schedule();
            }
        });
    }

    acquireLease(): { refs: Set<RecordRef>; release(): void } {
        if (this.disposed) {
            throw Object.assign(new Error('Runtime disposed'), { name: 'AbortError' });
        }
        const refs = new Set<RecordRef>();
        this.transientLeases.add(refs);

        return {
            refs,
            release: () => {
                if (this.transientLeases.delete(refs)) {
                    this.garbageCollector.schedule();
                }
            },
        };
    }

    registerRead<I, O>(
        query: Query<I, O>,
        codec: ReadCodec<I, O>,
        policy?: ReadPolicy<I>
    ): void {
        this.registry.register(query, codec, policy);
    }

    registerCommand<I, O>(command: Command<I, O>, policy: CommandPolicy<I, O>): void {
        this.commands.register(command, policy);
    }

    runCommand<I, O>(
        command: Command<I, O>,
        input: I,
        epoch = this.epoch
    ): Promise<CommandOutcome<O>> {
        return this.commands.run(command, input, epoch);
    }

    async execute<I, O>(command: Command<I, O>, input: I): Promise<O> {
        const result = await this.runCommand(command, input);

        return result.data;
    }

    matches(query: CachedQuery, refs?: readonly EntityRef[]): boolean {
        if (query.meta?.normalizedRead !== true) {
            return false;
        }

        return (
            !refs ||
            (query.meta.dependencies as EntityRef[]).some(ref => refs.includes(ref))
        );
    }

    fence(refs: readonly EntityRef[]): void {
        for (const ref of refs) {
            this.generations.set(ref, (this.generations.get(ref) ?? 0) + 1);
        }
    }

    resolve<I, O>(query: Query<I, O>, result: NormalizedResult): O {
        const refs = compositionRefs(result, this.store);
        const rows = refs.map(ref => this.projections.get(ref));
        if (rows.some(row => !row)) {
            throw new MissingEntityError(refs[rows.findIndex(row => !row)]!);
        }
        const previous = this.resolved.get(result);
        if (
            previous &&
            previous.rows.length === rows.length &&
            previous.rows.every((row, index) => row === rows[index])
        ) {
            return previous.output as O;
        }
        const output = this.registry.get(query).codec.resolve(result, this.projections);
        this.resolved.set(result, { rows, output });

        return output;
    }

    subscribe(result: NormalizedResult, listener: () => void): () => void {
        const subscriptions = new Map<RecordRef, () => void>();
        const update = () => {
            const refs = new Set(compositionRefs(result, this.store));
            for (const [ref, unsubscribe] of subscriptions) {
                if (!refs.has(ref)) {
                    unsubscribe();
                    subscriptions.delete(ref);
                }
            }
            for (const ref of refs) {
                if (!subscriptions.has(ref)) {
                    subscriptions.set(ref, this.store.subscribe(ref, update));
                }
            }
            listener();
        };
        for (const ref of compositionRefs(result, this.store)) {
            subscriptions.set(ref, this.store.subscribe(ref, update));
        }

        return () => {
            for (const unsubscribe of subscriptions.values()) {
                unsubscribe();
            }
        };
    }

    async fetch<I, O>(
        query: Query<I, O>,
        input: I,
        signal: AbortSignal
    ): Promise<NormalizedResult> {
        const epoch = this.epoch;
        const dependencies = query.reads(input);
        const generations = dependencies.map(ref => this.generations.get(ref) ?? 0);
        const isCurrent = () =>
            !this.disposed &&
            epoch === this.epoch &&
            !signal.aborted &&
            dependencies.every(
                (ref, index) => (this.generations.get(ref) ?? 0) === generations[index]
            );
        const barrier = this.commands.wait(dependencies, signal);
        if (barrier) {
            await barrier;
        }
        if (this.clearing) {
            await this.clearing;
        }
        if (!isCurrent()) {
            throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
        }
        const hash = hashKey([query.name, input]);
        const lease = new Set<RecordRef>();
        let leases = this.leases.get(hash);
        if (!leases) {
            this.leases.set(hash, (leases = new Set()));
        }
        leases.add(lease);
        try {
            const output = await query.execute(input, { signal });
            if (!isCurrent()) {
                throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
            }
            const staging = new ReadStagingStore(this.projections, lease);
            const codec = this.registry.get(query).codec;
            const result = await codec.normalize(output, input, staging);
            codec.resolve(result, staging);
            for (const ref of compositionRefs(result, this.store)) {
                lease.add(ref);
            }
            for (const ref of lease) {
                if (this.tombstones.has(ref)) {
                    throw new MissingEntityError(ref);
                }
            }
            await this.store.apply(staging.writes, {
                isCurrent: () =>
                    isCurrent() && [...lease].every(ref => !this.tombstones.has(ref)),
                signal,
            });
            if (!isCurrent()) {
                throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
            }

            return result;
        } catch (error) {
            leases.delete(lease);
            if (!this.disposed && epoch === this.epoch) {
                this.garbageCollector.schedule();
            }

            throw error;
        }
    }

    async read<I, O>(query: Query<I, O>, input: I, options?: ReadOptions): Promise<O> {
        const epoch = this.epoch;
        if (this.clearing) {
            await this.clearing;
        }
        if (this.disposed || epoch !== this.epoch || options?.signal?.aborted) {
            throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
        }
        const settings = queryOptionsFor(this, query, input);
        const cached = this.queryClient.getQueryData(settings.queryKey);
        if (cached) {
            try {
                this.resolve(query, cached);
            } catch (error) {
                if (!(error instanceof MissingEntityError)) {
                    throw error;
                }
                await this.queryClient.invalidateQueries({
                    queryKey: settings.queryKey,
                    exact: true,
                    refetchType: 'none',
                });
            }
        }
        if (this.disposed || epoch !== this.epoch || options?.signal?.aborted) {
            throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
        }
        const observer = new QueryObserver(this.queryClient, {
            ...settings,
            enabled: false,
        });
        const unsubscribe = observer.subscribe(() => {});
        let abort: () => void = () => {};
        const cancellation = new Promise<never>((_resolve, reject) => {
            abort = () => {
                reject(
                    Object.assign(new Error('Read cancelled'), { name: 'AbortError' })
                );
                unsubscribe();
            };
            this.waiters.add(abort);
            options?.signal?.addEventListener('abort', abort, { once: true });
        });
        try {
            const result = await Promise.race([
                this.queryClient.fetchQuery(settings),
                cancellation,
            ]);
            if (this.disposed || epoch !== this.epoch || options?.signal?.aborted) {
                throw Object.assign(new Error('Read cancelled'), { name: 'AbortError' });
            }

            return this.resolve(query, result);
        } finally {
            this.waiters.delete(abort);
            options?.signal?.removeEventListener('abort', abort);
            unsubscribe();
        }
    }

    clear(): Promise<void> {
        this.epoch++;
        this.commands.retire(this.disposed);
        this.leases.clear();
        this.transientLeases.clear();
        for (const abort of this.waiters) {
            abort();
        }
        this.garbageCollector.cancel();
        this.tombstones.clear();
        this.generations.clear();
        this.clearing = this.queryClient
            .cancelQueries({ predicate: query => this.matches(query) })
            .then(async () => {
                this.queryClient.removeQueries({
                    predicate: query => this.matches(query),
                });
                this.garbageCollector.cancel();
                await this.store.apply(
                    [...this.store.keys()].map(ref => ({ kind: 'remove', ref }))
                );
            });

        return this.clearing;
    }

    dispose(): Promise<void> {
        if (this.cleanup) {
            return this.cleanup;
        }
        this.disposed = true;
        this.unsubscribe();
        this.cleanup = this.clear().then(() => this.store.dispose());

        return this.cleanup;
    }
}
