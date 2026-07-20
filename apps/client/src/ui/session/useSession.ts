import { useRead } from '@/env/cache/useRead';
import { useEffect, useSyncExternalStore } from 'react';

import { useDependencies } from '../di/dependencies';

export function useSession() {
    const { getSession, session } = useDependencies();
    useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);

    return useRead(getSession, undefined, { enabled: session.canRead });
}

export function useActiveOrganization(data: ReturnType<typeof useSession>['data']) {
    const { session } = useDependencies();
    useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
    const orgs = data?.organizations ?? [];
    const activeOrg = orgs.find(org => org.id === session.activeOrgId) ?? orgs[0];
    useEffect(() => {
        if (data && session.canRead) {
            session.setActiveOrgId(activeOrg?.id ?? null);
        }
    }, [data, activeOrg?.id, session]);

    return {
        orgs,
        activeOrg,
        setActiveOrgId: (id: string) => session.setActiveOrgId(id),
    };
}
