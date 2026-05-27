import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Button, IconButton } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './DatasetRowContextMenu.module.scss';

export type DatasetRowContextMenuMode = 'actions' | 'delete';

export type DatasetRowContextMenuState = {
    rowId: string;
    rowIndex: number;
    x: number;
    y: number;
    mode: DatasetRowContextMenuMode;
};

type DatasetRowContextMenuProps = {
    state: DatasetRowContextMenuState;
    deleting: boolean;
    onInsertBelow: () => void;
    onAskDelete: () => void;
    onConfirmDelete: () => void;
    onCancel: () => void;
};

export const DatasetRowContextMenu = ({
    state,
    deleting,
    onInsertBelow,
    onAskDelete,
    onConfirmDelete,
    onCancel,
}: DatasetRowContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: state.x, top: state.y });

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
            state.y + rect.height + margin > window.innerHeight
                ? state.y - rect.height - margin
                : state.y;

        setPosition({
            left: Math.min(Math.max(state.x, margin), maxLeft),
            top: Math.min(Math.max(preferredTop, margin), maxTop),
        });
    }, [state.mode, state.x, state.y]);

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
            className={styles['menu']}
            style={{ left: position.left, top: position.top }}
            data-test-id={datasetsTestIds.rowContextMenu}
            role="menu"
        >
            {state.mode === 'actions' ? (
                <>
                    <button
                        className={styles['menu-item']}
                        type="button"
                        data-test-id={datasetsTestIds.insertRowMenuItem}
                        onClick={onInsertBelow}
                        role="menuitem"
                    >
                        <Plus size={16} />
                        Insert row below
                    </button>
                    <button
                        className={styles['menu-item']}
                        type="button"
                        data-test-id={datasetsTestIds.deleteRowMenuItem}
                        onClick={onAskDelete}
                        role="menuitem"
                    >
                        <Trash2 size={16} />
                        Delete row
                    </button>
                </>
            ) : (
                <div className={styles['confirm']}>
                    <div className={styles['confirm-copy']}>Delete this row?</div>
                    <div className={styles['confirm-actions']}>
                        <Button
                            data-test-id={datasetsTestIds.confirmDeleteRowButton}
                            tone="danger"
                            size="sm"
                            isLoading={deleting}
                            onClick={onConfirmDelete}
                        >
                            Delete
                        </Button>
                        <IconButton
                            data-test-id={datasetsTestIds.cancelDeleteRowButton}
                            tone="plain"
                            size="sm"
                            aria-label="Cancel delete"
                            onClick={onCancel}
                        >
                            <X size={16} />
                        </IconButton>
                    </div>
                </div>
            )}
        </div>
    );
};
