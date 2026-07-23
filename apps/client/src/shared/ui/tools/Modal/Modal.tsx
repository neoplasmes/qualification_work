import { IconButton, Text } from '@qualification-work/design-system';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import styles from './Modal.module.css';

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
    const dialog = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const element = dialog.current;
        if (!element) {
            return;
        }
        const opener = document.activeElement;
        const selector =
            ':is(button, input, select, textarea, a[href], [tabindex]):not(:disabled):not([tabindex="-1"]):not([type="hidden"])';
        (element.querySelector<HTMLElement>(selector) ?? element).focus();
        const trap = (event: KeyboardEvent) => {
            const dialogs = document.querySelectorAll(
                '[role="dialog"][aria-modal="true"]'
            );
            if (event.key !== 'Tab' || dialogs[dialogs.length - 1] !== element) {
                return;
            }
            const controls = Array.from(
                element.querySelectorAll<HTMLElement>(selector)
            ).filter(
                control =>
                    !control.hidden && control.getAttribute('aria-hidden') !== 'true'
            );
            const first = controls[0] ?? element;
            const last = controls[controls.length - 1] ?? element;
            if (
                !element.contains(document.activeElement) ||
                (!event.shiftKey && document.activeElement === last)
            ) {
                event.preventDefault();
                first.focus();
            } else if (
                event.shiftKey &&
                (document.activeElement === first || document.activeElement === element)
            ) {
                event.preventDefault();
                last.focus();
            }
        };
        document.addEventListener('keydown', trap);

        return () => {
            document.removeEventListener('keydown', trap);
            if (opener instanceof HTMLElement && opener.isConnected) {
                opener.focus();
            }
        };
    }, []);
    useEffect(() => {
        if (!closeOnEscape) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            const dialogs = document.querySelectorAll(
                '[role="dialog"][aria-modal="true"]'
            );
            if (e.key === 'Escape' && dialogs[dialogs.length - 1] === dialog.current) {
                onClose();
            }
        };
        document.addEventListener('keydown', handler);

        return () => document.removeEventListener('keydown', handler);
    }, [closeOnEscape, onClose]);

    if (typeof document === 'undefined') {
        return null;
    }

    const content = (
        <div
            data-theme="paper"
            data-stack="h"
            data-align="center"
            data-justify="center"
            className={styles['backdrop']}
            data-test-id={testId}
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                ref={dialog}
                tabIndex={-1}
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
                    <Text as="h2" variant="heading" className={styles['title']}>
                        {title}
                    </Text>
                    <div
                        className={styles['header-actions']}
                        data-stack="h"
                        data-gap="xs"
                        data-align="center"
                    >
                        {actions}
                        <IconButton
                            data-p="xs"
                            variant="ghost"
                            data-test-id={closeButtonTestId}
                            aria-label="Close modal"
                            onClick={onClose}
                        >
                            <X size={20} strokeWidth={2.6} />
                        </IconButton>
                    </div>
                </div>
                <div data-stack="v" data-gap="md" className={styles['body-scroll']}>
                    {children}
                </div>
                {/* {footer && <Separator />} */}
                {footer}
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
