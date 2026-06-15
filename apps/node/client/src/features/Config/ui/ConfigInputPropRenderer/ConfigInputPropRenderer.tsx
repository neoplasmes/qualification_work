import type { ReactNode } from 'react';

import { useConfigInput, type ConfigBind, type ConfigBinding } from '../../model';

/**
 * Props for renderless access to a config input binding
 *
 * @template T - draft object shape managed by the surrounding config root
 * @template V - value type exposed by the custom bind
 */
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
