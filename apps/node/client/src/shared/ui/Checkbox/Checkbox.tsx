import type { InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.scss';

type CheckboxProps = {
    label: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = ({ label, ...props }: CheckboxProps) => (
    <label className={styles['root']}>
        <input type="checkbox" {...props} />
        <span>{label}</span>
    </label>
);
