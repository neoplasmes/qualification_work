import { actionsPagePersistence } from '@/pages/Actions';
import { dashboardsPagePersistence } from '@/pages/Dashboards';
import { datasetsPagePersistence } from '@/pages/Datasets';

import { clearStoredActiveOrganization } from '@/features/authenticate';
import { filterApplicationEntitiesPersistence } from '@/features/filterApplicationEntities';

import { clearPersistedState } from './storePersistence';

export const authenticatedSessionStorageKeys = [
    actionsPagePersistence.key,
    'chartsPage_v1',
    datasetsPagePersistence.key,
    dashboardsPagePersistence.key,
    filterApplicationEntitiesPersistence.key,
] as const;

export const clearAuthenticatedSessionStorage = () => {
    clearPersistedState(authenticatedSessionStorageKeys);
    clearStoredActiveOrganization();
};
