import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AuthOrg, MeResponse } from '../api';

const activeOrgKey = 'qualification-work.active-org-id';
const activeOrgEvent = 'qualification-work.active-org-change';

const getStoredOrgId = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(activeOrgKey);
};

const setStoredOrgId = (orgId: string | null) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (orgId) {
        window.localStorage.setItem(activeOrgKey, orgId);
    } else {
        window.localStorage.removeItem(activeOrgKey);
    }

    window.dispatchEvent(new CustomEvent(activeOrgEvent, { detail: orgId }));
};

export const clearStoredActiveOrganization = () => setStoredOrgId(null);

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

        window.addEventListener(activeOrgEvent, handleChange);

        return () => window.removeEventListener(activeOrgEvent, handleChange);
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
