import { Eraser, Plus, Trash2, X } from 'lucide-react';

import { Button, ContextMenu, IconButton } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './DatasetRowContextMenu.module.scss';

export type DatasetRowContextMenuMode = 'actions' | 'delete';

export type DatasetRowContextMenuState = {
    // row the menu was opened on
    rowId: string;
    rowIndex: number;
    // rows the bulk actions apply to ([rowId] when nothing multi-selected)
    selectedRowIds: string[];
    x: number;
    y: number;
    mode: DatasetRowContextMenuMode;
};

type DatasetRowContextMenuProps = {
    state: DatasetRowContextMenuState;
    deleting: boolean;
    onInsertBelow: () => void;
    onClearSelected: () => void;
    onAskDelete: () => void;
    onConfirmDelete: () => void;
    onCancel: () => void;
};

export const DatasetRowContextMenu = ({
    state,
    deleting,
    onInsertBelow,
    onClearSelected,
    onAskDelete,
    onConfirmDelete,
    onCancel,
}: DatasetRowContextMenuProps) => {
    const selectedCount = state.selectedRowIds.length;
    const isMulti = selectedCount > 1;

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
                    {isMulti ? (
                        <>
                            <button
                                className={styles['menu-item']}
                                type="button"
                                data-test-id={datasetsTestIds.clearSelectedMenuItem}
                                onClick={onClearSelected}
                                role="menuitem"
                            >
                                <Eraser size={16} />
                                Clear selected
                            </button>
                            <button
                                className={`${styles['menu-item']} ${styles['danger']}`}
                                type="button"
                                data-test-id={datasetsTestIds.deleteSelectedRowsMenuItem}
                                onClick={onAskDelete}
                                role="menuitem"
                            >
                                <Trash2 size={16} />
                                Delete selected rows
                            </button>
                        </>
                    ) : (
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
                                className={`${styles['menu-item']} ${styles['danger']}`}
                                type="button"
                                data-test-id={datasetsTestIds.deleteRowMenuItem}
                                onClick={onAskDelete}
                                role="menuitem"
                            >
                                <Trash2 size={16} />
                                Delete row
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div className={styles['confirm']}>
                    <div className={styles['confirm-copy']}>
                        {isMulti ? `Delete ${selectedCount} rows?` : 'Delete this row?'}
                    </div>
                    <div className={styles['confirm-actions']}>
                        <Button
                            className={styles['confirm-delete-button']}
                            data-test-id={datasetsTestIds.confirmDeleteRowButton}
                            tone="danger"
                            size="sm"
                            isLoading={deleting}
                            onClick={onConfirmDelete}
                        >
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </Button>
                        <IconButton
                            className={styles['confirm-cancel-button']}
                            data-test-id={datasetsTestIds.cancelDeleteRowButton}
                            tone="plain"
                            aria-label="Cancel delete"
                            onClick={onCancel}
                        >
                            <X size={20} />
                        </IconButton>
                    </div>
                </div>
            )}
        </ContextMenu>
    );
};
