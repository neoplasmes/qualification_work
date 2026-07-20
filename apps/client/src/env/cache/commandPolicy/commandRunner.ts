import type { EntityRef } from '@/core/entities/entityRef';
import { NetworkError } from '@/env/transport/http';

import type { Command } from '@/app/commands/command';

import { ReadStagingStore } from '../normalize';
import type { CacheRuntime } from '../runtime';
import {
    UncertainCommandError,
    type CommandOutcome,
    type CommandPolicy,
} from './commandPolicy';

export class CommandRunner {
    private readonly policies = new WeakMap<object, unknown>();
    private readonly queues = new Map<string, Promise<void>>();
    private readonly barriers = new Set<{
        refs: readonly EntityRef[];
        settled: Promise<void>;
        release(): void;
    }>();
    private readonly listeners = new Set<() => void>();
    private closed = false;

    constructor(private readonly runtime: CacheRuntime) {}

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    };

    snapshot = (): number => this.runtime.epoch;

    register<I, O>(command: Command<I, O>, policy: CommandPolicy<I, O>): void {
        if (this.policies.has(command)) {
            throw new Error('Command already registered');
        }
        this.policies.set(command, policy);
    }

    retire(closed = false): void {
        this.closed = closed;
        this.queues.clear();
        for (const barrier of this.barriers) {
            barrier.release();
        }
        this.barriers.clear();
        for (const listener of this.listeners) {
            listener();
        }
    }

    wait(refs: readonly EntityRef[], signal: AbortSignal): Promise<void> | undefined {
        const barriers = [...this.barriers].filter(barrier =>
            barrier.refs.some(ref => refs.includes(ref))
        );
        if (!barriers.length) {
            return;
        }
        let abort!: () => void;
        const cancellation = new Promise<never>((_resolve, reject) => {
            abort = () =>
                reject(
                    Object.assign(new Error('Read cancelled'), { name: 'AbortError' })
                );
            signal.addEventListener('abort', abort, { once: true });
            if (signal.aborted) {
                abort();
            }
        });

        return Promise.race([
            Promise.all(barriers.map(barrier => barrier.settled)),
            cancellation,
        ])
            .finally(() => signal.removeEventListener('abort', abort))
            .then(() => this.wait(refs, signal));
    }

    run<I, O>(
        command: Command<I, O>,
        input: I,
        epoch = this.runtime.epoch
    ): Promise<CommandOutcome<O>> {
        const policy = this.policies.get(command) as CommandPolicy<I, O> | undefined;
        if (!policy) {
            return Promise.reject(new Error('Unregistered command'));
        }
        const key = policy.conflictKey(input);
        const previous = this.queues.get(key) ?? Promise.resolve();
        const isCurrent = () => !this.closed && epoch === this.runtime.epoch;
        const result = previous.then(async () => {
            await this.runtime.clearing;
            if (!isCurrent()) {
                throw Object.assign(new Error('Command cancelled'), {
                    name: 'AbortError',
                });
            }
            const affected = policy.affected(input);
            let release!: () => void;
            const settled = new Promise<void>(resolve => {
                release = resolve;
            });
            const barrier = { refs: affected, settled, release };
            this.barriers.add(barrier);
            const lease = this.runtime.acquireLease();
            let data: O;
            let syncError: unknown = null;
            let writes = affected;
            const cancelled = new Map<Parameters<CacheRuntime['matches']>[0], number>();
            try {
                this.runtime.fence(affected);
                await this.runtime.queryClient.cancelQueries({
                    predicate: query => {
                        if (!this.runtime.matches(query, affected)) {
                            return false;
                        }
                        if (query.state.fetchStatus !== 'idle') {
                            cancelled.set(query, query.state.dataUpdateCount);
                        }

                        return true;
                    },
                });
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }
                try {
                    data = await command.execute(input);
                } catch (error) {
                    this.barriers.delete(barrier);
                    release();
                    if (!isCurrent()) {
                        throw Object.assign(new Error('Command cancelled'), {
                            name: 'AbortError',
                        });
                    }
                    try {
                        await this.runtime.invalidator.invalidate(affected, {
                            fenced: true,
                            epoch,
                        });
                    } catch (error) {
                        syncError = error;
                    }
                    if (!isCurrent()) {
                        throw Object.assign(new Error('Command cancelled'), {
                            name: 'AbortError',
                        });
                    }
                    if (error instanceof NetworkError) {
                        throw new UncertainCommandError(error, syncError);
                    }

                    throw error;
                }
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }
                try {
                    writes = command.writes(input, data);
                    const staging = new ReadStagingStore(
                        this.runtime.projections,
                        lease.refs
                    );
                    const composition = await policy.codec.normalize(
                        data,
                        input,
                        staging
                    );
                    policy.codec.resolve(composition, staging);
                    const removals = policy.removals(input, data);
                    for (const ref of removals) {
                        await staging.remove(ref);
                    }
                    await this.runtime.store.apply(staging.writes, {
                        isCurrent: () => {
                            if (!isCurrent()) {
                                return false;
                            }
                            for (const ref of removals) {
                                this.runtime.tombstones.add(ref);
                            }

                            return true;
                        },
                    });
                } catch (error) {
                    syncError = error;
                }
                this.barriers.delete(barrier);
                release();
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }
                try {
                    await this.runtime.options.onCommandConfirmed?.({
                        refs: writes,
                        epoch,
                    });
                } catch (error) {
                    syncError ??= error;
                }
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }
                try {
                    await this.runtime.invalidator.invalidate(writes, {
                        fenced: true,
                        epoch,
                    });
                } catch (error) {
                    syncError ??= error;
                }
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }

                try {
                    await this.runtime.queryClient.refetchQueries(
                        {
                            type: 'active',
                            predicate: query =>
                                cancelled.get(query) === query.state.dataUpdateCount &&
                                !this.runtime.matches(query, writes),
                        },
                        { cancelRefetch: false, throwOnError: true }
                    );
                } catch (error) {
                    syncError ??= error;
                }
                if (!isCurrent()) {
                    throw Object.assign(new Error('Command cancelled'), {
                        name: 'AbortError',
                    });
                }

                return { data, syncError };
            } finally {
                this.barriers.delete(barrier);
                release();
                lease.release();
            }
        });
        const tail = result.then(
            () => {},
            () => {}
        );
        this.queues.set(key, tail);
        void tail.then(() => {
            if (this.queues.get(key) === tail) {
                this.queues.delete(key);
            }
        });

        return result;
    }
}
