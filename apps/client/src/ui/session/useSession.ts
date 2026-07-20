import { useRead } from '@/env/cache/useRead';
import { useActiveOrganizationState } from '@/ui/widgets/NavBar';
import { useEffect, useSyncExternalStore } from 'react';

import { useDependencies } from '../di/dependencies';

export function useSession() {
    const { getSession, session } = useDependencies();
    useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);

    return useRead(getSession, undefined, { enabled: session.canRead });
}

export function useActiveOrganization(data: ReturnType<typeof useSession>['data']) {
    const { session, ui } = useDependencies();
    const { activeOrgId, hydrated } = useActiveOrganizationState();
    const orgs = data?.organizations ?? [];
    const activeOrg = orgs.find(org => org.id === activeOrgId) ?? orgs[0];
    useEffect(() => {
        if (data && session.canRead && hydrated) {
            ui.activeOrganization.getState().setActiveOrgId(activeOrg?.id ?? null);
        }
    }, [data, activeOrg?.id, session, ui, hydrated]);

    return {
        orgs,
        activeOrg,
        setActiveOrgId: (id: string) =>
            ui.activeOrganization.getState().setActiveOrgId(id),
    };
}
