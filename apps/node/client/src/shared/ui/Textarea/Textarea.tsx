import type { TextareaHTMLAttributes } from 'react';

import styles from './Textarea.module.scss';

type TextareaProps = {
    invalid?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = ({ invalid, className, ...props }: TextareaProps) => (
    <textarea
        className={[styles['textarea'], invalid ? styles['invalid'] : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
        aria-invalid={invalid || undefined}
        {...props}
    />
);
