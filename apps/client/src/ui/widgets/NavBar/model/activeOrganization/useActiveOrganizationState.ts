import { useDependencies } from '@/ui/di/dependencies';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export function useActiveOrganizationState() {
    return useStore(
        useDependencies().ui.activeOrganization,
        useShallow(state => ({
            activeOrgId: state.activeOrgId,
            hydrated: state.hydrated,
            setActiveOrgId: state.setActiveOrgId,
        }))
    );
}
