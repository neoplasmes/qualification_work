import type { CacheRuntime } from '@/env/cache/runtime';
import type { Dependencies, SessionController, UiState } from '@/ui/di/dependencies';

import type { AppStore } from '@/app/model/store';

import { api } from '@/shared/api';

export class SessionLifecycle implements SessionController {
    canRead = true;
    authenticated = false;
    private generation = 0;
    private closed = false;
    private readonly listeners = new Set<() => void>();
    private controller = new AbortController();
    private navigate: (path: string) => void = () => {};
    private readonly unsubscribe: () => void;

    constructor(
        private readonly options: {
            cache: CacheRuntime;
            operations: Pick<Dependencies, 'getSession' | 'logout'>;
            store: AppStore;
            browser: boolean;
            rotate(): void;
            ui: UiState;
        }
    ) {
        this.unsubscribe = options.cache.queryClient.getQueryCache().subscribe(event => {
            if (
                !this.canRead ||
                event.type === 'removed' ||
                event.query.queryKey[0] !== options.operations.getSession.name ||
                event.query.state.status !== 'success' ||
                !event.query.state.data
            ) {
                return;
            }
            this.authenticated = true;
        });
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    };
    snapshot = (): number => this.generation;

    private publish(): void {
        this.generation++;
        for (const listener of this.listeners) {
            listener();
        }
    }

    setNavigator(navigate: (path: string) => void): void {
        this.navigate = navigate;
    }

    async reset(): Promise<void> {
        this.canRead = false;
        this.authenticated = false;
        this.controller.abort();
        this.controller = new AbortController();
        this.publish();
        const clearing = this.options.cache.clear();
        this.options.rotate();
        for (const read of this.options.store.dispatch(
            api.util.getRunningQueriesThunk()
        )) {
            read.abort();
        }
        this.options.store.dispatch(api.util.resetApiState());
        this.options.ui.reset();
        await clearing;
    }

    async expire(): Promise<void> {
        if (this.closed || !this.authenticated) {
            return;
        }
        const clearing = this.reset();
        const epoch = this.options.cache.epoch;
        await clearing;
        if (!this.closed && epoch === this.options.cache.epoch) {
            this.navigate('/sign-in');
        }
    }

    async logout(): Promise<void> {
        const clearing = this.reset();
        const epoch = this.options.cache.epoch;
        await clearing;
        if (this.closed || epoch !== this.options.cache.epoch) {
            return;
        }
        try {
            await this.options.cache.execute(this.options.operations.logout, undefined);
        } catch {
            // ignore logout errors
        } finally {
            if (!this.closed && epoch === this.options.cache.epoch) {
                const clearing = this.reset();
                const resetEpoch = this.options.cache.epoch;
                await clearing;
                if (!this.closed && resetEpoch === this.options.cache.epoch) {
                    this.navigate('/sign-in');
                }
            }
        }
    }

    async waitForWorkspace(signal?: AbortSignal): Promise<void> {
        const epoch = this.options.cache.epoch;
        const ownSignal = this.controller.signal;
        const combined = signal ? AbortSignal.any([signal, ownSignal]) : ownSignal;
        for (let attempt = 0; attempt < 40; attempt++) {
            if (this.closed || combined.aborted || epoch !== this.options.cache.epoch) {
                throw new DOMException('Session changed', 'AbortError');
            }
            await this.options.cache.queryClient.invalidateQueries({
                queryKey: [this.options.operations.getSession.name],
                refetchType: 'none',
            });
            const session = await this.options.cache.read(
                this.options.operations.getSession,
                undefined,
                { signal: combined }
            );
            if (this.closed || combined.aborted || epoch !== this.options.cache.epoch) {
                throw new DOMException('Session changed', 'AbortError');
            }
            if (!session.isInitializing && session.organizations.length > 0) {
                this.canRead = true;
                this.authenticated = true;
                this.options.ui.activeOrganization
                    .getState()
                    .setActiveOrgId(
                        session.organizations.find(
                            org =>
                                org.id ===
                                this.options.ui.activeOrganization.getState().activeOrgId
                        )?.id ?? session.organizations[0]!.id
                    );
                this.publish();
                this.navigate('/datasets');

                return;
            }
            await new Promise<void>((resolve, reject) => {
                const abort = () => {
                    clearTimeout(timer);
                    reject(new DOMException('Session changed', 'AbortError'));
                };
                const timer = setTimeout(() => {
                    combined.removeEventListener('abort', abort);
                    resolve();
                }, 250);
                combined.addEventListener('abort', abort, { once: true });
                if (combined.aborted) {
                    abort();
                }
            });
        }

        throw new Error('Workspace is still preparing. Please try again shortly.');
    }

    dispose(): void {
        this.closed = true;
        this.controller.abort();
        this.unsubscribe();
        this.listeners.clear();
        this.navigate = () => {};
    }
}
