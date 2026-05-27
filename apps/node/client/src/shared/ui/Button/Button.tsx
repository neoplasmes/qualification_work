import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, CSSProperties, FC } from 'react';
import { Link, type LinkProps } from 'react-router';

import styles from './Button.module.scss';

type ButtonProps = {
    variant?: 'default' | 'danger';
    tone?: ButtonTone;
    size?: 'sm' | 'md';
    isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: FC<ButtonProps> = ({
    variant,
    tone = variant ?? 'default',
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
        {isLoading && <Loader2 className={styles['loader']} size={16} aria-hidden />}
        {children}
    </button>
);

type IconButtonProps = {
    variant?: 'default' | 'danger';
    tone?: ButtonTone;
    size?: 'sm' | 'md';
    isLoading?: boolean;
    iconPadding?: IconPadding;
    iconStrokeWidth?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton: FC<IconButtonProps> = ({
    variant,
    tone = variant ?? 'default',
    size = 'md',
    isLoading = false,
    className,
    iconPadding,
    iconStrokeWidth,
    style,
    type = 'button',
    disabled,
    children,
    'data-icon-p': dataIconPadding,
    ...props
}) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={getButtonClassName('icon', tone, size, className)}
        data-icon-p={iconPadding ?? dataIconPadding}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        style={getIconButtonStyle(style, iconStrokeWidth)}
        {...props}
    >
        {isLoading ? (
            <Loader2 className={styles['loader']} size={16} aria-hidden />
        ) : (
            children
        )}
    </button>
);

type ButtonLinkProps = {
    variant?: 'default' | 'danger';
    tone?: ButtonTone;
    size?: 'sm' | 'md';
} & LinkProps;

export const ButtonLink: FC<ButtonLinkProps> = ({
    variant,
    tone = variant ?? 'default',
    size = 'md',
    className,
    ...props
}) => <Link className={getButtonClassName('button', tone, size, className)} {...props} />;

type IconButtonLinkProps = {
    variant?: 'default' | 'danger';
    tone?: ButtonTone;
    size?: 'sm' | 'md';
    iconPadding?: IconPadding;
} & LinkProps;

export const IconButtonLink: FC<IconButtonLinkProps> = ({
    variant,
    tone = variant ?? 'default',
    size = 'md',
    iconPadding,
    className,
    style,
    'data-icon-p': dataIconPadding,
    ...props
}) => (
    <Link
        className={getButtonClassName('icon', tone, size, className)}
        data-icon-p={iconPadding ?? dataIconPadding}
        style={getIconButtonStyle(style, undefined)}
        {...props}
    />
);

type ButtonTone = 'default' | 'danger' | 'ghost' | 'plain' | 'transparent' | 'nav';

const getButtonClassName = (
    base: 'button' | 'icon',
    tone: ButtonTone,
    size: 'sm' | 'md',
    className?: string
) =>
    [
        styles[base],
        styles[`size-${size}`],
        tone !== 'default' ? styles[tone] : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

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
