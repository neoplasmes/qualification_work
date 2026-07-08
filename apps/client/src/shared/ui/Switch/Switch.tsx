import type { InputHTMLAttributes } from 'react';

import styles from './Switch.module.scss';

type SwitchProps = {
    className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Switch = ({ className, ...props }: SwitchProps) => (
    <label className={[styles['root'], className ?? ''].filter(Boolean).join(' ')}>
        <input type="checkbox" role="switch" {...props} />
        <span className={styles['track']} aria-hidden>
            <span className={styles['thumb']} />
        </span>
    </label>
);
