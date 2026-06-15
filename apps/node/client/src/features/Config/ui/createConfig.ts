import type { ReactNode } from 'react';

import {
    useConfig as useConfigHook,
    useConfigInput,
    type ConfigBind,
    type ConfigBinding,
    type ConfigFieldKey,
    type ConfigSnapshot,
} from '../model';
import { ConfigInput, type ConfigInputProps } from './ConfigInput';
import {
    ConfigInputPropRenderer,
    type ConfigInputPropRendererProps,
} from './ConfigInputPropRenderer';
import { ConfigRoot, type ConfigRootProps } from './ConfigRoot';
import { ConfigSection, type ConfigSectionProps } from './ConfigSection';
import { ConfigSelect, type ConfigSelectProps } from './ConfigSelect';

type ConfigUseInput<T extends object> = {
    <K extends keyof T & string>(field: K): ConfigBinding<T[K]>;
    <V>(bind: ConfigBind<T, V>): ConfigBinding<V>;
    <V>(field: ConfigFieldKey<T, V>): ConfigBinding<V>;
};

/**
 * Config UI kit bound to a concrete draft type
 *
 * @template T - draft object shape managed by the generated config components
 */
export type Config<T extends object> = {
    Root: (props: ConfigRootProps<T>) => ReactNode;
    Section: (props: ConfigSectionProps<T>) => ReactNode;
    Input: (props: ConfigInputProps<T>) => ReactNode;
    InputPropRenderer: <V>(props: ConfigInputPropRendererProps<T, V>) => ReactNode;
    Select: <V extends string>(props: ConfigSelectProps<T, V>) => ReactNode;
    useInput: ConfigUseInput<T>;
    useConfig: () => ConfigSnapshot<T>;
};

/**
 * creates a set of components and hooks for development and managment of different forms
 *
 * @template T - draft object shape managed by the generated config components
 * @returns
 */
export const createConfig = <T extends object>(): Config<T> => {
    const useInput = useConfigInput as Config<T>['useInput'];
    const useConfig = useConfigHook as Config<T>['useConfig'];

    return {
        Root: ConfigRoot,
        Section: ConfigSection,
        Input: ConfigInput,
        InputPropRenderer: ConfigInputPropRenderer,
        Select: ConfigSelect,
        useInput,
        useConfig,
    };
};
