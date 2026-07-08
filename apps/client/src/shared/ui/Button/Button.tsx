import { Loader2, type LucideIcon } from 'lucide-react';
import {
    Children,
    isValidElement,
    type ButtonHTMLAttributes,
    type ComponentProps,
    type CSSProperties,
    type FC,
    type ReactElement,
    type ReactNode,
} from 'react';

import styles from './Button.module.scss';

type ButtonTone = 'default' | 'danger' | 'ghost' | 'plain' | 'transparent' | 'nav';
type ButtonSize = 'sm' | 'md';

// only a lucide icon element is allowed as IconButton children
type LucideElement = ReactElement<ComponentProps<LucideIcon>, LucideIcon>;

const defaultLoaderSize = 16;

const isIconElement = (child: ReactNode): child is LucideElement =>
    isValidElement<ComponentProps<LucideIcon>>(child) && typeof child.type !== 'string';

const getIconSize = (icon?: LucideElement) =>
    icon?.props.size ?? icon?.props.width ?? icon?.props.height ?? defaultLoaderSize;

const getIconStrokeWidth = (
    icon: LucideElement | undefined,
    strokeWidth?: ComponentProps<LucideIcon>['strokeWidth']
) => strokeWidth ?? icon?.props.strokeWidth;

const getLoader = (
    icon?: LucideElement,
    strokeWidth?: ComponentProps<LucideIcon>['strokeWidth'],
    key?: string
): ReactNode => (
    <Loader2
        key={key}
        className={styles['loader']}
        size={getIconSize(icon)}
        strokeWidth={getIconStrokeWidth(icon, strokeWidth)}
        aria-hidden
    />
);

const getLoadingChildren = (children: ReactNode): ReactNode => {
    let replaced = false;
    const nextChildren = Children.map(children, child => {
        if (replaced || !isIconElement(child)) {
            return child;
        }

        replaced = true;

        return getLoader(child);
    });

    return replaced
        ? nextChildren
        : [getLoader(undefined, undefined, 'loader'), ...Children.toArray(children)];
};

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
        {isLoading ? getLoadingChildren(children) : children}
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
    iconStrokeWidth: ComponentProps<LucideIcon>['strokeWidth'] | undefined
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
}) => {
    const resolvedStrokeWidth = getIconStrokeWidth(children, iconStrokeWidth);

    return (
        <button
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={getIconClassName(tone, className)}
            data-display="inline-flex"
            data-align="center"
            data-justify="center"
            disabled={disabled || isLoading}
            aria-busy={isLoading || undefined}
            style={getIconButtonStyle(style, resolvedStrokeWidth)}
            {...props}
        >
            {isLoading ? getLoader(children, resolvedStrokeWidth) : children}
        </button>
    );
};
