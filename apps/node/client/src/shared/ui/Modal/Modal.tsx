import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import { IconButton } from '../Button';

import styles from './Modal.module.scss';

type ModalProps = {
    title: string;
    ariaLabel?: string;
    closeButtonTestId?: string;
    testId?: string;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    onClose: () => void;
    children: ReactNode;
};

export const Modal = ({
    title,
    ariaLabel,
    closeButtonTestId,
    testId,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    onClose,
    children,
}: ModalProps) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handler);

        return () => document.removeEventListener('keydown', handler);
    }, [closeOnEscape, onClose]);

    return (
        <div
            className={styles['backdrop']}
            data-test-id={testId}
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel ?? title}
                className={`${styles['modal']} ${styles[`size-${size}`]}`}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles['header']}>
                    <span className={styles['title']}>{title}</span>
                    <IconButton
                        size="sm"
                        tone="ghost"
                        data-test-id={closeButtonTestId}
                        aria-label="Close modal"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </IconButton>
                </div>
                <div className={styles['body']}>{children}</div>
                {footer && <div className={styles['footer']}>{footer}</div>}
            </div>
        </div>
    );
};
