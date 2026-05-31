import { m } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

export type SegmentedControlOption<Value extends string> = {
    value: Value;
    label: ReactNode;
    count?: number;
    testId?: string;
    disabled?: boolean;
};

type SegmentedControlClassNames = {
    indicator?: string;
    item?: string;
    itemActive?: string;
    label?: string;
    count?: string;
};

type SegmentedControlProps<Value extends string> = {
    value: Value;
    options: readonly SegmentedControlOption<Value>[];
    ariaLabel: string;
    className?: string;
    classNames?: SegmentedControlClassNames;
    disabled?: boolean;
    style?: CSSProperties;
    transition?: { duration: number };
    onChange: (value: Value) => void;
};

const joinClassNames = (...classNames: Array<string | undefined | false>) =>
    classNames.filter(Boolean).join(' ');

export const SegmentedControl = <Value extends string>({
    value,
    options,
    ariaLabel,
    className,
    classNames,
    disabled = false,
    style,
    transition = { duration: 0.2 },
    onChange,
}: SegmentedControlProps<Value>) => {
    const activeIndex = Math.max(
        options.findIndex(option => option.value === value),
        0
    );

    return (
        <div className={className} role="tablist" aria-label={ariaLabel} style={style}>
            <m.div
                aria-hidden
                className={classNames?.indicator}
                initial={false}
                animate={{ x: `${activeIndex * 100}%` }}
                transition={transition}
            />
            {options.map(option => {
                const active = option.value === value;
                const itemDisabled = disabled || option.disabled;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-test-id={option.testId}
                        className={joinClassNames(
                            classNames?.item,
                            active && classNames?.itemActive
                        )}
                        disabled={itemDisabled}
                        onClick={() => onChange(option.value)}
                    >
                        <span className={classNames?.label}>{option.label}</span>
                        {option.count ? (
                            <span className={classNames?.count}>{option.count}</span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
};
