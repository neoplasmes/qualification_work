import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

import styles from './Modal.module.scss';

type ModalProps = {
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export const Modal = ({ title, onClose, children }: ModalProps) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className={styles['backdrop']} onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className={styles['modal']}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles['header']}>
                    <span className={styles['title']}>{title}</span>
                    <button
                        type="button"
                        className={styles['close']}
                        aria-label="Close modal"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
