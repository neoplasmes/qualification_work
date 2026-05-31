import { Loader2, type LucideIcon } from 'lucide-react';
import type {
    ButtonHTMLAttributes,
    ComponentProps,
    CSSProperties,
    FC,
    ReactElement,
    ReactNode,
} from 'react';

import styles from './Button.module.scss';

type ButtonTone = 'default' | 'danger' | 'ghost' | 'plain' | 'transparent' | 'nav';
type ButtonSize = 'sm' | 'md';

// only a lucide icon element is allowed as IconButton children
type LucideElement = ReactElement<ComponentProps<LucideIcon>, LucideIcon>;

const loader: ReactNode = <Loader2 className={styles['loader']} size={16} aria-hidden />;

// ———————————————————————————— Button component ————————————————————————————

const getButtonClassName = (tone: ButtonTone, size: ButtonSize, className?: string) => {
    let result = styles['button'];
    const sizeClassName = styles[`size-${size}`];
    if (sizeClassName) {
        result += ` ${sizeClassName}`;
    }
    if (tone !== 'default') {
        result += ` ${styles[tone]}`;
    }
    if (className) {
        result += ` ${className}`;
    }

    return result;
};

type ButtonProps = {
    tone?: ButtonTone;
    size?: ButtonSize;
    isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: FC<ButtonProps> = ({
    tone = 'default',
    size = 'md',
    isLoading = false,
    className,
    type = 'button',
    disabled,
    children,
    ...props
}) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={getButtonClassName(tone, size, className)}
        data-display="inline-flex"
        data-align="center"
        data-justify="center"
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
    >
        {isLoading && loader}
        {children}
    </button>
);

// ———————————————————————————— IconButton component ————————————————————————————

const getIconClassName = (tone: ButtonTone, className?: string) => {
    let result = styles['icon'] ?? '';
    if (tone !== 'default') {
        result += ` ${styles[tone]}`;
    }
    if (className) {
        result += ` ${className}`;
    }

    return result;
};

const getIconButtonStyle = (
    style: CSSProperties | undefined,
    iconStrokeWidth: number | undefined
): CSSProperties | undefined => {
    if (iconStrokeWidth === undefined) {
        return style;
    }

    return {
        ...style,
        '--icon-stroke-width': iconStrokeWidth,
    } as CSSProperties;
};

type IconButtonProps = {
    tone?: ButtonTone;
    isLoading?: boolean;
    iconStrokeWidth?: number;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
        children: LucideElement;
    };

export const IconButton: FC<IconButtonProps> = ({
    tone = 'nav',
    isLoading = false,
    className,
    iconStrokeWidth,
    style,
    type = 'button',
    disabled,
    children,
    ...props
}) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={getIconClassName(tone, className)}
        data-display="inline-flex"
        data-align="center"
        data-justify="center"
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        style={getIconButtonStyle(style, iconStrokeWidth)}
        {...props}
    >
        {isLoading ? loader : children}
    </button>
);
