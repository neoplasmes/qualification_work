import { useId, useMemo, type ReactNode } from 'react';

import { Explain, Separator, Switch } from '@/shared/ui';

import { useConfigInput, type ConfigBind, type ConfigFieldKey } from '../../model';

import styles from './ConfigSection.module.scss';

/**
 * Props for a visual config section with optional enabled state binding
 *
 * @template T - draft object shape managed by the surrounding config root
 */
export type ConfigSectionProps<T extends object> = {
    name: string;
    explain?: ReactNode;
    children: ReactNode;
    enabled?: boolean;
    enabledBind?: ConfigBind<T, boolean>;
    enabledField?: ConfigFieldKey<T, boolean>;
    onEnabledChange?: (enabled: boolean) => void;
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
    enabledField,
    onEnabledChange,
    className,
}: ConfigSectionProps<T>) => {
    const labelId = useId();
    const enabledSource =
        enabledBind ?? enabledField ?? (fallbackEnabledBind as ConfigBind<T, boolean>);
    const enabledInput = useConfigInput(enabledSource as ConfigBind<T, boolean>);

    const hasBindToggle = enabledBind !== undefined || enabledField !== undefined;
    const hasExternalToggle = enabled !== undefined;
    const hasSwitch = hasBindToggle || hasExternalToggle;
    const checked = hasBindToggle ? enabledInput.value : enabled !== false;
    const switchDisabled = hasExternalToggle && !onEnabledChange;

    const rootClassName = useMemo(
        () =>
            [styles['root'], !checked ? styles['root-hidden'] : '', className ?? '']
                .filter(Boolean)
                .join(' '),
        [checked, className]
    );

    const handleEnabledChange = (nextEnabled: boolean) => {
        if (hasBindToggle) {
            enabledInput.setValue(nextEnabled);

            return;
        }

        onEnabledChange?.(nextEnabled);
    };

    return (
        <section className={rootClassName} data-stack="v" data-gap="sm">
            <div
                className={styles['header']}
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
            {checked && (
                <div data-config-section-body data-stack="v" data-gap="sm">
                    {children}
                </div>
            )}
        </section>
    );
};
