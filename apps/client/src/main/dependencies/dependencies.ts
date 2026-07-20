import { createCollectionSync } from '@/env/cache/collectionSync';
import { EntityStore } from '@/env/cache/entityStore';
import { sessionFreshness } from '@/env/cache/freshness';
import { CacheRuntime } from '@/env/cache/runtime';
import { HttpOrganizationRepo } from '@/env/repos/organization';
import { HttpSessionRepo } from '@/env/repos/session';
import { HttpTransport } from '@/env/transport/http';
import type { Dependencies } from '@/ui/di/dependencies';
import { DbClient } from '@tanstack/db';

import { createCreateOrganization } from '@/app/commands/createOrganization';
import { createDeleteOrganization } from '@/app/commands/deleteOrganization';
import { createLogin } from '@/app/commands/login';
import { createLogout } from '@/app/commands/logout';
import { createRegister } from '@/app/commands/register';
import { createStore } from '@/app/model/store';
import { createGetSession } from '@/app/queries/getSession';

import { api } from '@/shared/api';

import { createCacheBridge } from '../cacheBridge';
import { createQueryClient } from '../queryClient';
import { SessionLifecycle } from '../sessionLifecycle';
import { createUiState } from '../uiState';
import { sessionCodec, valueCodec } from './sessionCodec';

export interface ApplicationRuntime {
    dependencies: Dependencies;
    cache: CacheRuntime;
    legacyStore: ReturnType<typeof createStore>;
    readonly scopeId: string;
    acceptScope(scopeId: string): void;
    dispose(): Promise<void>;
}

export function createDependencies(options: {
    platform: 'server' | 'browser';
    apiBaseUrl: string;
    requestCookie?: string;
    requestSignal?: AbortSignal;
}): ApplicationRuntime {
    let live = true;
    let scopeId = crypto.randomUUID() as string;
    let detach = () => {};
    let cleanup: Promise<void> | undefined;
    const ui = createUiState(options.platform === 'browser');
    const cache = new CacheRuntime(
        createQueryClient(),
        new EntityStore(new DbClient(), [
            createCollectionSync('user'),
            createCollectionSync('organization'),
            createCollectionSync('dataset'),
            createCollectionSync('datasetColumn'),
            createCollectionSync('datasetRow'),
            createCollectionSync('chart'),
            createCollectionSync('dashboard', row => row.items ?? []),
            createCollectionSync('dashboardItem'),
            createCollectionSync('action'),
            createCollectionSync('actionRun'),
        ]),
        {
            onCommandConfirmed: event => {
                bridge.confirmed(event);
                const selected = ui.activeOrganization.getState().activeOrgId;
                const selectedRef = selected
                    ? (`organization:${encodeURIComponent(selected)}` as const)
                    : undefined;
                if (
                    live &&
                    event.epoch === cache.epoch &&
                    selectedRef &&
                    event.refs.includes(selectedRef)
                ) {
                    cache.tombstones.add(selectedRef);
                    ui.activeOrganization.getState().setActiveOrgId(null);
                }
            },
        }
    );
    const bridge = createCacheBridge(cache, error =>
        console.error('Legacy cache synchronization failed', error)
    );
    const legacyStore = createStore(undefined, {
        apiExtraArgument: { requestCookie: options.requestCookie },
        middleware: bridge.middleware,
    });
    bridge.attach(legacyStore.dispatch);
    const transport = new HttpTransport({
        baseUrl: options.apiBaseUrl,
        fetch: globalThis.fetch.bind(globalThis),
    });
    const sessionRepo = new HttpSessionRepo(transport);
    const organizationRepo = new HttpOrganizationRepo(transport);
    const operations = {
        getSession: createGetSession(sessionRepo),
        register: createRegister(sessionRepo),
        login: createLogin(sessionRepo),
        logout: createLogout(sessionRepo),
        createOrganization: createCreateOrganization(organizationRepo),
        deleteOrganization: createDeleteOrganization(organizationRepo),
    };
    const rotate = () => {
        scopeId = crypto.randomUUID();
        bridge.reset();
        detach();
        const epoch = cache.epoch;
        detach = sessionRepo.attachInterceptors({
            requestCookie: options.requestCookie,
            onExpired: () => {
                if (live && options.platform === 'browser' && epoch === cache.epoch) {
                    void session
                        .expire()
                        .catch(error => console.error('Session cleanup failed', error));
                }
            },
        });
    };
    const session = new SessionLifecycle({
        cache,
        operations,
        store: legacyStore,
        browser: options.platform === 'browser',
        rotate,
        ui,
    });
    rotate();
    const dependencies: Dependencies = { ...operations, session, ui };
    cache.registerRead(operations.getSession, sessionCodec, sessionFreshness);
    cache.registerCommand(operations.register, {
        conflictKey: () => 'session',
        affected: () => ['user'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.login, {
        conflictKey: () => 'session',
        affected: () => ['session', 'user', 'organization'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.logout, {
        conflictKey: () => 'session',
        affected: () => ['session', 'user', 'organization'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.createOrganization, {
        conflictKey: () => 'session',
        affected: () => ['session', 'organization'],
        codec: valueCodec(),
        removals: () => [],
    });
    cache.registerCommand(operations.deleteOrganization, {
        conflictKey: () => 'session',
        affected: () => ['session', 'organization'],
        codec: valueCodec(),
        removals: input => [`organization:${encodeURIComponent(input.orgId)}`],
    });
    const dispose = (): Promise<void> => {
        if (cleanup) {
            return cleanup;
        }
        live = false;
        options.requestSignal?.removeEventListener('abort', abort);
        detach();
        bridge.dispose();
        session.dispose();
        ui.dispose();
        for (const read of legacyStore.dispatch(api.util.getRunningQueriesThunk())) {
            read.abort();
        }
        legacyStore.dispatch(api.util.resetApiState());
        cleanup = cache.dispose();

        return cleanup;
    };
    const abort = () => {
        void dispose().catch(error => console.error('Runtime disposal failed', error));
    };
    options.requestSignal?.addEventListener('abort', abort, { once: true });
    if (options.requestSignal?.aborted) {
        abort();
    }

    return {
        dependencies,
        cache,
        legacyStore,
        get scopeId() {
            return scopeId;
        },
        acceptScope(value) {
            if (cache.epoch !== 0 || cache.queryClient.getQueryCache().getAll().length) {
                throw new Error('Initial scope already established');
            }
            scopeId = value;
        },
        dispose,
    };
}
