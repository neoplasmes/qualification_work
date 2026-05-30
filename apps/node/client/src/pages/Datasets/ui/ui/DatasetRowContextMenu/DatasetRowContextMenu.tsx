import { Plus, Trash2, X } from 'lucide-react';

import { Button, ContextMenu, IconButton } from '@/shared/ui';

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
    return (
        <ContextMenu
            x={state.x}
            y={state.y}
            className={styles['menu']}
            data-test-id={datasetsTestIds.rowContextMenu}
            onCancel={onCancel}
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
                            data-p="xs"
                            aria-label="Cancel delete"
                            onClick={onCancel}
                        >
                            <X size={16} />
                        </IconButton>
                    </div>
                </div>
            )}
        </ContextMenu>
    );
};
