import { Badge } from '../Badge';

import styles from './SegmentedTabs.module.scss';

export type SegmentedTabOption<Value extends string> = {
    value: Value;
    label: string;
    count?: number;
    testId?: string;
    disabled?: boolean;
};

type SegmentedTabsProps<Value extends string> = {
    value: Value;
    options: readonly SegmentedTabOption<Value>[];
    columns?: 2 | 3 | 4;
    disabled?: boolean;
    className?: string;
    onChange: (value: Value) => void;
};

export const SegmentedTabs = <Value extends string>({
    value,
    options,
    columns = 2,
    disabled = false,
    className,
    onChange,
}: SegmentedTabsProps<Value>) => (
    <div
        data-display="grid"
        data-gap="xs"
        className={[styles['tabs'], styles[`cols-${columns}`], className ?? '']
            .filter(Boolean)
            .join(' ')}
    >
        {options.map(option => (
            <button
                type="button"
                key={option.value}
                data-px="sm"
                data-py="xs"
                data-test-id={option.testId}
                className={`${styles['tab']} ${option.value === value ? styles['active'] : ''}`}
                disabled={disabled || option.disabled}
                aria-pressed={option.value === value}
                onClick={() => onChange(option.value)}
            >
                {option.label}
                {!!option.count && <Badge tone="primary">{option.count}</Badge>}
            </button>
        ))}
    </div>
);
