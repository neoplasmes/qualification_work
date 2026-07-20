import { type LucideIcon } from 'lucide-react';
import { m } from 'motion/react';

import styles from './workspaceModeTabs.widget.module.css';

export type WorkspaceModeTabOption<V extends string> = {
    value: V;
    label: string;
    icon?: LucideIcon;
    testId?: string;
    disabled?: boolean;
};

type WorkspaceModeTabsProps<V extends string> = {
    value: V;
    options: readonly WorkspaceModeTabOption<V>[];
    layoutId: string;
    columns?: 2 | 3 | 4;
    onChange: (value: V) => void;
};

export const WorkspaceModeTabs = <V extends string>({
    value,
    options,
    layoutId,
    columns,
    onChange,
}: WorkspaceModeTabsProps<V>) => (
    <div
        className={[styles['tabs'], columns ? styles[`cols-${columns}`] : '']
            .filter(Boolean)
            .join(' ')}
        data-stack={columns ? undefined : 'h'}
        data-gap="xs"
        role="tablist"
    >
        {options.map(option => {
            const Icon = option.icon;
            const active = option.value === value;

            return (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-test-id={option.testId}
                    disabled={option.disabled}
                    className={`${styles['tab']} ${active ? styles['active'] : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {Icon && <Icon size={15} />}
                    {option.label}
                    {active && (
                        <m.div
                            className={styles['active-indicator']}
                            layoutId={layoutId}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </button>
            );
        })}
    </div>
);
