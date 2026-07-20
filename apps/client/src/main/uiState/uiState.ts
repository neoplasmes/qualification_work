import { actionsPagePersistence, createActionsPageStore } from '@/ui/pages/actions';
import { createChartsPreferencesStore } from '@/ui/pages/charts';
import {
    createDashboardsPageStore,
    dashboardsPagePersistence,
} from '@/ui/pages/dashboards';
import { createDatasetsPageStore, datasetsPagePersistence } from '@/ui/pages/datasets';
import {
    createFiltersStore,
    filterApplicationEntitiesPersistence,
} from '@/ui/widgets/FilterPanel';
import {
    activeOrganizationKey,
    createActiveOrganizationStore,
} from '@/ui/widgets/NavBar';
import {
    createPanelLayoutStore,
    panelLayoutPersistence,
} from '@/ui/widgets/WorkspaceGrid';

import { persistentStateStorage } from '@/shared/lib/persistentState';

export function createUiState(browser: boolean) {
    const panelLayout = createPanelLayoutStore();
    const datasets = createDatasetsPageStore();
    const actions = createActionsPageStore();
    const charts = createChartsPreferencesStore();
    const dashboards = createDashboardsPageStore();
    const filters = createFiltersStore();
    const activeOrganization = createActiveOrganizationStore();
    const persisted: Array<{
        store: object;
        key: string;
        hydrate(): void;
        subscribe(): () => void;
    }> = [];
    const register = <S, P extends Record<string, unknown>>(
        store: {
            getState(): S;
            setState(state: Partial<S>): void;
            subscribe(listener: () => void): () => void;
        },
        descriptor: {
            key: string;
            fallbackState: P;
            getInitialState(state: P): Partial<S>;
            pickPersistedState(state: S): P;
        }
    ) => {
        persisted.push({
            store,
            key: descriptor.key,
            hydrate() {
                const patch = {
                    ...descriptor.getInitialState(
                        persistentStateStorage.load(
                            descriptor.key,
                            descriptor.fallbackState
                        )
                    ),
                };
                for (const key of changed.get(store) ?? []) {
                    delete patch[key as keyof S];
                }
                store.setState(patch);
            },
            subscribe() {
                return persistentStateStorage.subscribeSlices(store, [
                    {
                        key: descriptor.key,
                        selectPersistedState: descriptor.pickPersistedState,
                    },
                ]);
            },
        });
    };
    register(panelLayout, panelLayoutPersistence);
    register(datasets, datasetsPagePersistence);
    register(actions, actionsPagePersistence);
    register(dashboards, dashboardsPagePersistence);
    register(filters, filterApplicationEntitiesPersistence);
    let hydrated = false;
    let hydrating = false;
    let closed = false;
    let resetting = false;
    const changed = new Map<object, Set<string>>();
    const cleanup: Array<() => void> = [];
    const defaults = {
        datasets: datasets.getInitialState(),
        actions: actions.getInitialState(),
        charts: charts.getInitialState(),
        dashboards: dashboards.getInitialState(),
        filters: filters.getInitialState(),
    };
    const storageKeys = persisted
        .slice(1)
        .map(item => item.key)
        .concat('chartsPage_v1', activeOrganizationKey);
    for (const store of [panelLayout, datasets, actions, dashboards, filters]) {
        cleanup.push(
            store.subscribe((next, previous) => {
                if (hydrating || hydrated) {
                    return;
                }
                const fields = changed.get(store) ?? new Set<string>();
                for (const key of Object.keys(next)) {
                    if (Reflect.get(next, key) !== Reflect.get(previous, key)) {
                        fields.add(key);
                    }
                }
                changed.set(store, fields);
            })
        );
    }
    cleanup.push(
        activeOrganization.subscribe((next, previous) => {
            if (hydrating || next.activeOrgId === previous.activeOrgId) {
                return;
            }
            changed.set(activeOrganization, new Set(['activeOrgId']));
            if (browser && hydrated && !resetting) {
                try {
                    if (next.activeOrgId) {
                        localStorage.setItem(activeOrganizationKey, next.activeOrgId);
                    } else {
                        localStorage.removeItem(activeOrganizationKey);
                    }
                } catch {
                    /* ignore storage access errors */
                }
            }
        })
    );

    return {
        panelLayout,
        datasets,
        actions,
        charts,
        dashboards,
        filters,
        activeOrganization,
        hydrate() {
            if (!browser || hydrated || closed) {
                return;
            }
            hydrating = true;
            // descriptors retain their own data projection while stores retain their actions
            for (const item of persisted) {
                item.hydrate();
            }
            if (!changed.has(activeOrganization)) {
                try {
                    activeOrganization.setState({
                        activeOrgId: localStorage.getItem(activeOrganizationKey),
                    });
                } catch {
                    /* ignore storage access errors */
                }
            }
            activeOrganization.setState({ hydrated: true });
            hydrated = true;
            hydrating = false;
            for (const item of persisted) {
                cleanup.push(item.subscribe());
            }
        },
        reset() {
            resetting = true;
            datasets.setState(defaults.datasets, true);
            actions.setState(defaults.actions, true);
            charts.setState(defaults.charts, true);
            dashboards.setState(defaults.dashboards, true);
            filters.setState(defaults.filters, true);
            activeOrganization.getState().setActiveOrgId(null);
            if (browser) {
                persistentStateStorage.clear(storageKeys);
            }
            resetting = false;
        },
        dispose() {
            closed = true;
            cleanup.splice(0).forEach(unsubscribe => unsubscribe());
        },
    };
}
