import { createStore } from 'zustand/vanilla';

export const activeOrganizationKey = 'qualification-work.active-org-id';
export interface ActiveOrganizationState {
    activeOrgId: string | null;
    hydrated: boolean;
    setActiveOrgId(id: string | null): void;
}
export function createActiveOrganizationStore(
    initial: Partial<Pick<ActiveOrganizationState, 'activeOrgId'>> = {}
) {
    return createStore<ActiveOrganizationState>()(set => ({
        activeOrgId: null,
        hydrated: false,
        ...initial,
        setActiveOrgId: activeOrgId => set({ activeOrgId }),
    }));
}
