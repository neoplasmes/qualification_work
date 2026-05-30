import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import styles from './ContextMenu.module.scss';

type ContextMenuProps = {
    x: number;
    y: number;
    children: ReactNode;
    className?: string;
    'data-test-id'?: string;
    onCancel: () => void;
};

export const ContextMenu = ({
    x,
    y,
    children,
    className,
    'data-test-id': testId,
    onCancel,
}: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: x, top: y });

    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) {
            return;
        }

        const margin = 8;
        const rect = menu.getBoundingClientRect();
        const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
        const preferredTop =
            y + rect.height + margin > window.innerHeight ? y - rect.height - margin : y;

        setPosition({
            left: Math.min(Math.max(x, margin), maxLeft),
            top: Math.min(Math.max(preferredTop, margin), maxTop),
        });
    }, [x, y, children]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                onCancel();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCancel();
            }
        };
        const handleScroll = () => onCancel();

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [onCancel]);

    return (
        <div
            ref={menuRef}
            className={[styles['menu'], className ?? ''].filter(Boolean).join(' ')}
            style={{ left: position.left, top: position.top }}
            data-test-id={testId}
            role="menu"
        >
            {children}
        </div>
    );
};
