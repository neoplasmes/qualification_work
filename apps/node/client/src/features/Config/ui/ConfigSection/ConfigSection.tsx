import { useEffect, useId, useMemo, type ReactNode } from 'react';

import { Explain, Separator, Switch } from '@/shared/ui';

import {
    useConfigInput,
    useConfigStoreContext,
    type ConfigBind,
    type ConfigMutator,
} from '../../model';

import styles from './ConfigSection.module.scss';

export type ConfigSectionProps<T extends object> = {
    name: string;
    explain?: ReactNode;
    children: ReactNode;
    enabled?: boolean;
    enabledBind?: ConfigBind<T, boolean>;
    onEnabledChange?: (enabled: boolean) => void;
    disabledOutput?: ConfigMutator<T>;
    className?: string;
};

const fallbackEnabledBind: ConfigBind<object, boolean> = {
    get: () => false,
    set: () => {},
};

export const ConfigSection = <T extends object>({
    name,
    explain,
    children,
    enabled,
    enabledBind,
    onEnabledChange,
    disabledOutput,
    className,
}: ConfigSectionProps<T>) => {
    const store = useConfigStoreContext<T, T>();
    const sectionId = useId();
    const labelId = useId();
    const enabledInput = useConfigInput(
        (enabledBind ?? fallbackEnabledBind) as ConfigBind<T, boolean>
    );

    const hasBindToggle = enabledBind !== undefined;
    const hasExternalToggle = enabled !== undefined;
    const hasSwitch = hasBindToggle || hasExternalToggle;
    const checked = hasBindToggle ? enabledInput.value : enabled !== false;
    const switchDisabled = hasExternalToggle && !onEnabledChange;

    const headerClassName = useMemo(
        () =>
            [styles['header'], !checked ? styles['header-hidden'] : '', className ?? '']
                .filter(Boolean)
                .join(' '),
        [checked, className]
    );

    useEffect(() => {
        if (!hasSwitch || !disabledOutput) {
            return;
        }

        const rule = {
            id: sectionId,
            enabled: checked,
            apply: disabledOutput,
        };

        store.addDisabledSectionOutputRule(rule);

        return () => {
            store.removeDisabledSectionOutputRule(rule);
        };
    }, [checked, disabledOutput, hasSwitch, sectionId, store]);

    const handleEnabledChange = (nextEnabled: boolean) => {
        if (enabledBind) {
            enabledInput.setValue(nextEnabled);

            return;
        }

        onEnabledChange?.(nextEnabled);
    };

    return (
        <>
            <div
                className={headerClassName}
                data-stack="h"
                data-gap="sm"
                data-align="center"
            >
                <Separator data-flex />
                <span data-display="inline-flex" data-gap="xs" data-align="center">
                    <span id={labelId}>{name}</span>
                    {explain && (
                        <Explain label={`Explain ${name}`} description={explain} />
                    )}
                </span>
                {hasSwitch && (
                    <Switch
                        aria-labelledby={labelId}
                        checked={checked}
                        disabled={switchDisabled}
                        onChange={event =>
                            handleEnabledChange(event.currentTarget.checked)
                        }
                    />
                )}
            </div>
            {checked && children}
        </>
    );
};
