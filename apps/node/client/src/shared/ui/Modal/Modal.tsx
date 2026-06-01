import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from '../Button';

import styles from './Modal.module.scss';

type ModalProps = {
    title: string;
    ariaLabel?: string;
    actions?: ReactNode;
    closeButtonTestId?: string;
    testId?: string;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    padding?:
        | 'xs'
        | 'sm'
        | 'sm-plus'
        | 'md'
        | 'md-plus'
        | 'lg'
        | 'lg-plus'
        | 'xl'
        | '2xl'
        | '3xl'
        | 'none';
    height?: number;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    onClose: () => void;
    children: ReactNode;
};

export const Modal = ({
    title,
    ariaLabel,
    actions,
    closeButtonTestId,
    testId,
    footer,
    size = 'md',
    padding = 'lg',
    height,
    closeOnBackdrop = true,
    closeOnEscape = true,
    onClose,
    children,
}: ModalProps) => {
    useEffect(() => {
        if (!closeOnEscape) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handler);

        return () => document.removeEventListener('keydown', handler);
    }, [closeOnEscape, onClose]);

    const content = (
        <div
            data-stack="h"
            data-align="center"
            data-justify="center"
            className={styles['backdrop']}
            data-test-id={testId}
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel ?? title}
                data-stack="v"
                data-gap="md"
                data-p={padding}
                className={`${styles['modal']} ${styles[`size-${size}`]}`}
                style={height !== undefined ? { height: `${height}px` } : undefined}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles['header']} data-stack="h" data-align="center">
                    <span className={styles['title']}>{title}</span>
                    <div
                        className={styles['header-actions']}
                        data-stack="h"
                        data-gap="xs"
                        data-align="center"
                    >
                        {actions}
                        <IconButton
                            data-p="xs"
                            tone="nav"
                            data-test-id={closeButtonTestId}
                            aria-label="Close modal"
                            onClick={onClose}
                        >
                            <X size={20} strokeWidth={2.6} />
                        </IconButton>
                    </div>
                </div>
                <div data-display="grid" data-gap="md" className={styles['body-scroll']}>
                    {children}
                </div>
                {/* {footer && <Separator />} */}
                {footer}
            </div>
        </div>
    );

    if (typeof document === 'undefined') {
        return content;
    }

    return createPortal(content, document.body);
};
