import type { ReactNode } from 'react';

import { useConfigInput, type ConfigBind, type ConfigBinding } from '../../model';

export type ConfigInputPropRendererProps<T extends object, V> = {
    bind: ConfigBind<T, V>;
    children: (field: ConfigBinding<V>) => ReactNode;
};

export const ConfigInputPropRenderer = <T extends object, V>({
    bind,
    children,
}: ConfigInputPropRendererProps<T, V>) => {
    const input = useConfigInput(bind);

    return children(input);
};
