import type { ButtonHTMLAttributes, FC } from 'react';
import { Link, type LinkProps } from 'react-router';

import styles from './Button.module.scss';

type ButtonProps = {
    variant?: 'default' | 'danger';
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: FC<ButtonProps> = ({ variant, className, type = 'button', ...props }) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={[styles['button'], variant === 'danger' ? styles['danger'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    />
);

type IconButtonProps = {
    variant?: 'default' | 'danger';
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton: FC<IconButtonProps> = ({ variant, className, type = 'button', ...props }) => (
    <button
        // eslint-disable-next-line react/button-has-type
        type={type}
        className={[styles['icon'], variant === 'danger' ? styles['danger'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    />
);

type ButtonLinkProps = {
    variant?: 'default' | 'danger';
} & LinkProps;

export const ButtonLink: FC<ButtonLinkProps> = ({ variant, className, ...props }) => (
    <Link
        className={[styles['button'], variant === 'danger' ? styles['danger'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    />
);

type IconButtonLinkProps = {
    variant?: 'default' | 'danger';
} & LinkProps;

export const IconButtonLink: FC<IconButtonLinkProps> = ({ variant, className, ...props }) => (
    <Link
        className={[styles['icon'], variant === 'danger' ? styles['danger'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        {...props}
    />
);
