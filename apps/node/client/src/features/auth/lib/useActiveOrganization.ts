import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthOrg, MeResponse } from '../api';

const ACTIVE_ORG_KEY = 'qualification-work.active-org-id';
const ACTIVE_ORG_EVENT = 'qualification-work.active-org-change';

const getStoredOrgId = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(ACTIVE_ORG_KEY);
};

const setStoredOrgId = (orgId: string | null) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (orgId) {
        window.localStorage.setItem(ACTIVE_ORG_KEY, orgId);
    } else {
        window.localStorage.removeItem(ACTIVE_ORG_KEY);
    }

    window.dispatchEvent(new CustomEvent(ACTIVE_ORG_EVENT, { detail: orgId }));
};

export const getActiveOrganization = (
    me: MeResponse | undefined,
    preferredOrgId: string | null
): AuthOrg | undefined => {
    const orgs = me?.organizations ?? [];

    if (orgs.length === 0) {
        return undefined;
    }

    return orgs.find(org => org.id === preferredOrgId) ?? orgs[0];
};

export const useActiveOrganization = (me: MeResponse | undefined) => {
    const [preferredOrgId, setPreferredOrgId] = useState<string | null>(() =>
        getStoredOrgId()
    );

    useEffect(() => {
        const handleChange = (event: Event) => {
            setPreferredOrgId((event as CustomEvent<string | null>).detail ?? null);
        };

        window.addEventListener(ACTIVE_ORG_EVENT, handleChange);

        return () => window.removeEventListener(ACTIVE_ORG_EVENT, handleChange);
    }, []);

    const orgs = me?.organizations ?? [];
    const activeOrg = useMemo(
        () => getActiveOrganization(me, preferredOrgId),
        [me, preferredOrgId]
    );

    useEffect(() => {
        if (orgs.length === 0) {
            setStoredOrgId(null);

            return;
        }

        if (!activeOrg) {
            setStoredOrgId(orgs[0].id);

            return;
        }

        if (preferredOrgId !== activeOrg.id) {
            setStoredOrgId(activeOrg.id);
        }
    }, [activeOrg, orgs, preferredOrgId]);

    const setActiveOrgId = useCallback((orgId: string) => {
        setStoredOrgId(orgId);
    }, []);

    const clearActiveOrg = useCallback(() => {
        setStoredOrgId(null);
    }, []);

    return { activeOrg, orgs, setActiveOrgId, clearActiveOrg };
};
