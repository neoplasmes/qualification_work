import { Eye, PencilLine, type LucideIcon } from 'lucide-react';
import { m } from 'motion/react';

import styles from './WorkspaceModeTabs.module.scss';

export type WorkspaceModeTabOption<Value extends string> = {
    value: Value;
    label: 'View' | 'Edit';
    testId?: string;
    disabled?: boolean;
};

type WorkspaceModeTabsProps<Value extends string> = {
    value: Value;
    options: readonly WorkspaceModeTabOption<Value>[];
    layoutId: string;
    onChange: (value: Value) => void;
};

const TAB_ICONS: Record<WorkspaceModeTabOption<string>['label'], LucideIcon> = {
    View: Eye,
    Edit: PencilLine,
};

export const WorkspaceModeTabs = <Value extends string>({
    value,
    options,
    layoutId,
    onChange,
}: WorkspaceModeTabsProps<Value>) => (
    <div className={styles['tabs']} data-stack="h" data-gap="xs" role="tablist">
        {options.map(option => {
            const Icon = TAB_ICONS[option.label];
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
                    <Icon size={15} />
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
