import {
    Suspense,
    type ComponentType,
    type LazyExoticComponent,
    type SuspenseProps,
} from 'react';

import { useHasMounted } from '@/shared/lib/useHasMounted/useHasMounted';

export type ClientOnlyDefferedProps<T extends object> = {
    fallback: SuspenseProps['fallback'];
    LazyComponent: LazyExoticComponent<ComponentType<T>>;
    componentProps?: T;
};

/**
 *
 * @param param0
 * @returns
 */
export const ClientOnlyDeffered = <T extends object>({
    fallback,
    LazyComponent,
    componentProps,
}: ClientOnlyDefferedProps<T>) => {
    const mounted = useHasMounted();

    if (!mounted) {
        return <>{fallback}</>;
    }

    return (
        <Suspense fallback={fallback}>
            <LazyComponent {...(componentProps as T)} />
        </Suspense>
    );
};
