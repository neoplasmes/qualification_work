import { Button, IconButton } from '@qualification-work/design-system';
import { Eraser, Plus, Trash2, X } from 'lucide-react';

import { ContextMenu } from '@/shared/ui';

import { datasetsTestIds } from '../../const';

import styles from './datasetRowContextMenu.module.css';

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
                                Очистить выбранные
                            </button>
                            <button
                                className={`${styles['menu-item']} ${styles['danger']}`}
                                type="button"
                                data-test-id={datasetsTestIds.deleteSelectedRowsMenuItem}
                                onClick={onAskDelete}
                                role="menuitem"
                            >
                                <Trash2 size={16} />
                                Удалить выбранные строки
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
                                Вставить строку ниже
                            </button>
                            <button
                                className={`${styles['menu-item']} ${styles['danger']}`}
                                type="button"
                                data-test-id={datasetsTestIds.deleteRowMenuItem}
                                onClick={onAskDelete}
                                role="menuitem"
                            >
                                <Trash2 size={16} />
                                Удалить строку
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div className={styles['confirm']}>
                    <div className={styles['confirm-copy']}>
                        {isMulti
                            ? `Удалить строки: ${selectedCount}?`
                            : 'Удалить эту строку?'}
                    </div>
                    <div className={styles['confirm-actions']}>
                        <Button
                            className={styles['confirm-delete-button']}
                            data-test-id={datasetsTestIds.confirmDeleteRowButton}
                            variant="danger"
                            size="regular"
                            aria-busy={deleting}
                            onClick={onConfirmDelete}
                            disabled={deleting}
                        >
                            <Trash2 size={14} />
                            <span>Удалить</span>
                        </Button>
                        <IconButton
                            className={styles['confirm-cancel-button']}
                            data-test-id={datasetsTestIds.cancelDeleteRowButton}
                            variant="ghost"
                            aria-label="Отменить удаление"
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
