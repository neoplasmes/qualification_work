import {
    useEffect,
    useMemo,
    useRef,
    type FormHTMLAttributes,
    type ReactNode,
} from 'react';

import { ConfigStore, configStoreContext } from '../../model';

import styles from './ConfigRoot.module.css';

type ConfigRootStateProps<T extends object> = {
    value?: T;
    defaultValue?: T;
    onChange?: (draft: T) => void;
};

type ConfigRootReservedProps = 'children' | 'defaultValue' | 'onChange' | 'value';

/**
 * Props for the root form that owns a config draft store
 *
 * @template T - draft object shape managed by this config form
 */
export type ConfigRootProps<T extends object> = ConfigRootStateProps<T> & {
    children: ReactNode;
} & Omit<FormHTMLAttributes<HTMLFormElement>, ConfigRootReservedProps>;

export const ConfigRoot = <T extends object>({
    children,
    className,
    value,
    defaultValue,
    onChange,
    onSubmit,
    ...props
}: ConfigRootProps<T>) => {
    const initialDraft = value ?? defaultValue;

    if (!initialDraft) {
        throw new Error('Config.Root expects value or defaultValue.');
    }

    const storeRef = useRef(new ConfigStore<T>(initialDraft));

    storeRef.current.setOptions({ onChange });

    useEffect(() => {
        if (value !== undefined) {
            storeRef.current.replaceDraft(value);
        }
    }, [storeRef.current, value]);

    const rootClassName = useMemo(
        () => [styles['root'], className ?? ''].filter(Boolean).join(' '),
        [className]
    );
    const content = (
        <configStoreContext.Provider
            value={storeRef.current as unknown as ConfigStore<object>}
        >
            {children}
        </configStoreContext.Provider>
    );

    const handleSubmit: FormHTMLAttributes<HTMLFormElement>['onSubmit'] = event => {
        event.preventDefault();
        onSubmit?.(event);
    };

    return (
        <form {...props} className={rootClassName} onSubmit={handleSubmit} data-px="sm">
            {content}
        </form>
    );
};
