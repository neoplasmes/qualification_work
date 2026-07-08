import type { CSSProperties, InputHTMLAttributes } from 'react';

import styles from './Slider.module.scss';

type SliderProps = InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
};

const getSliderProgress = (
    value: SliderProps['value'],
    min: SliderProps['min'],
    max: SliderProps['max']
) => {
    const numericValue = Number(value ?? min ?? 0);
    const numericMin = Number(min ?? 0);
    const numericMax = Number(max ?? 100);

    if (
        !Number.isFinite(numericValue) ||
        !Number.isFinite(numericMin) ||
        !Number.isFinite(numericMax) ||
        numericMin >= numericMax
    ) {
        return 0;
    }

    const clamped = Math.min(numericMax, Math.max(numericMin, numericValue));

    return ((clamped - numericMin) / (numericMax - numericMin)) * 100;
};

export const Slider = ({
    className,
    invalid,
    min = 0,
    max = 100,
    value,
    style,
    ...props
}: SliderProps) => {
    const progress = getSliderProgress(value, min, max);
    const sliderStyle = {
        ...style,
        '--slider-progress': `${progress}%`,
    } as CSSProperties;

    return (
        <input
            {...props}
            className={[
                styles['slider'],
                invalid ? styles['invalid'] : '',
                className ?? '',
            ]
                .filter(Boolean)
                .join(' ')}
            type="range"
            min={min}
            max={max}
            value={value}
            style={sliderStyle}
            aria-invalid={invalid || undefined}
        />
    );
};
