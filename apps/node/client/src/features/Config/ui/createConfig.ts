import type { ReactNode } from 'react';

import {
    useConfig as useConfigHook,
    useConfigInput,
    type ConfigBind,
    type ConfigBinding,
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

export type Config<T extends object, O> = {
    Root: (props: ConfigRootProps<T, O>) => ReactNode;
    Section: (props: ConfigSectionProps<T>) => ReactNode;
    Input: (props: ConfigInputProps<T>) => ReactNode;
    InputPropRenderer: <V>(props: ConfigInputPropRendererProps<T, V>) => ReactNode;
    Select: <V extends string>(props: ConfigSelectProps<T, V>) => ReactNode;
    useInput: <V>(bind: ConfigBind<T, V>) => ConfigBinding<V>;
    useConfig: () => ConfigSnapshot<T, O>;
};

/**
 * creates a set of components and hooks for development and managment of different forms
 *
 * @template T config (draft) type
 * @template [O=T] output type. by "output" it is meant a modificated version of
 * draft, that will be used for futher purposes, e.g. to be sent as HTTP payload
 * @returns
 */
export const createConfig = <T extends object, O = T>(): Config<T, O> => {
    const useInput = useConfigInput as Config<T, O>['useInput'];
    const useConfig = useConfigHook as Config<T, O>['useConfig'];

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
