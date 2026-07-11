import type { ButtonProps } from '../Button';
import { Button } from '../Button';
import styles from './iconButton.module.css';

export type IconButtonProps = Omit<ButtonProps, 'aria-label'> & { 'aria-label': string; danger?: boolean };

export function IconButton({ className, danger, variant = 'ghost', ...props }: IconButtonProps) {
    return <Button {...props} variant={variant} className={`${styles.iconButton}${danger ? ` ${styles.danger}` : ''}${className ? ` ${className}` : ''}`} />;
}
