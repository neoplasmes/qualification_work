import {
    useEffect,
    useMemo,
    useRef,
    type FormHTMLAttributes,
    type ReactNode,
    type SubmitEvent,
} from 'react';

import { ConfigStore, configStoreContext, type ConfigToOutput } from '../../model';

import styles from './ConfigRoot.module.scss';

type ConfigRootStateProps<T extends object> = {
    value?: T;
    defaultValue?: T;
    onChange?: (draft: T) => void;
};

type ConfigRootReservedProps = 'children' | 'defaultValue' | 'onChange' | 'value';

export type ConfigRootProps<T extends object, O> = ConfigRootStateProps<T> & {
    children: ReactNode;
    onOutputChange?: (output: O) => void;
    toOutput?: ConfigToOutput<T, O>;
} & Omit<FormHTMLAttributes<HTMLFormElement>, ConfigRootReservedProps>;

export const ConfigRoot = <T extends object, O = T>({
    children,
    className,
    value,
    defaultValue,
    onChange,
    onOutputChange,
    onSubmit,
    toOutput,
    ...props
}: ConfigRootProps<T, O>) => {
    const initialDraft = value ?? defaultValue;

    if (!initialDraft) {
        throw new Error('Config.Root expects value or defaultValue.');
    }

    const storeRef = useRef(new ConfigStore<T, O>(initialDraft));

    storeRef.current.setOptions({ onChange, onOutputChange, configToOutput: toOutput });

    useEffect(() => {
        if (value !== undefined) {
            storeRef.current.replaceDraft(value);
        }
    }, [storeRef.current, value]);

    useEffect(() => {
        storeRef.current.refreshOutput();
    }, [storeRef.current, toOutput, onOutputChange]);

    const rootClassName = useMemo(
        () => [styles['root'], className ?? ''].filter(Boolean).join(' '),
        [className]
    );
    const content = (
        <configStoreContext.Provider
            value={storeRef.current as unknown as ConfigStore<object, unknown>}
        >
            {children}
        </configStoreContext.Provider>
    );

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit?.(event);
    };

    return (
        <form {...props} className={rootClassName} onSubmit={handleSubmit}>
            {content}
        </form>
    );
};
