import { useDependencies } from '@/ui/di/dependencies';
import { useLayoutEffect } from 'react';

export function usePersistedStateHydration(enabled: boolean) {
    const { ui } = useDependencies();
    useLayoutEffect(() => {
        if (enabled) {
            ui.hydrate();
        }
    }, [ui, enabled]);
}
