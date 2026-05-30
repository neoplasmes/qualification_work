import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, CSSProperties, FC, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

import styles from './Button.module.scss';

type ButtonTone = 'default' | 'danger' | 'ghost' | 'plain' | 'transparent' | 'nav';
type ButtonSize = 'sm' | 'md';

type BaseButtonProps = {
    tone?: ButtonTone;
    size?: ButtonSize;
};

type BaseIconProps = {
    iconPadding?: IconPadding;
};

const loader: ReactNode = <Loader2 className={styles['loader']} size={16} aria-hidden />;

type ButtonProps = BaseButtonProps & {
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
        className={getButtonClassName('button', tone, size, className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
    >
        {isLoading && loader}
        {children}
    </button>
);

type IconButtonProps = BaseButtonProps &
    BaseIconProps & {
        isLoading?: boolean;
        iconStrokeWidth?: number;
    } & ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton: FC<IconButtonProps> = ({
    tone = 'default',
    size = 'md',
    isLoading = false,
    className,
    iconPadding,
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
        className={getButtonClassName('icon', tone, size, className)}
        data-icon-p={iconPadding}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        style={getIconButtonStyle(style, iconStrokeWidth)}
        {...props}
    >
        {isLoading ? loader : children}
    </button>
);

type ButtonLinkProps = BaseButtonProps & LinkProps;

export const ButtonLink: FC<ButtonLinkProps> = ({
    tone = 'default',
    size = 'md',
    className,
    ...props
}) => <Link className={getButtonClassName('button', tone, size, className)} {...props} />;

type IconButtonLinkProps = BaseButtonProps & BaseIconProps & LinkProps;

export const IconButtonLink: FC<IconButtonLinkProps> = ({
    tone = 'default',
    size = 'md',
    iconPadding,
    className,
    ...props
}) => (
    <Link
        className={getButtonClassName('icon', tone, size, className)}
        data-icon-p={iconPadding}
        {...props}
    />
);

const getButtonClassName = (
    base: 'button' | 'icon',
    tone: ButtonTone,
    size: ButtonSize,
    className?: string
) => {
    let result = `${styles[base]} ${styles[`size-${size}`]}`;
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
