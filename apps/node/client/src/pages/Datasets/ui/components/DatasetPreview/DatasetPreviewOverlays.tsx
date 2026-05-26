import type { InsertRowDraft } from '../DatasetGrid/types';
import {
    DatasetRowContextMenu,
    type DatasetRowContextMenuState,
} from '../DatasetRowContextMenu';
import { NewRowActions } from '../NewRowActions';

import styles from './DatasetPreview.module.scss';

type DatasetPreviewOverlaysProps = {
    insertDraft: InsertRowDraft | null;
    contextMenu: DatasetRowContextMenuState | null;
    insertValid: boolean;
    insertLoading: boolean;
    deleteLoading: boolean;
    onInsertConfirm: () => void;
    onInsertCancel: () => void;
    onInsertBelow: () => void;
    onAskDelete: () => void;
    onDeleteConfirm: () => void;
    onMenuCancel: () => void;
};

export const DatasetPreviewOverlays = ({
    insertDraft,
    contextMenu,
    insertValid,
    insertLoading,
    deleteLoading,
    onInsertConfirm,
    onInsertCancel,
    onInsertBelow,
    onAskDelete,
    onDeleteConfirm,
    onMenuCancel,
}: DatasetPreviewOverlaysProps) => (
    <>
        {insertDraft && (
            <div className={styles['floating-actions']}>
                <NewRowActions
                    valid={insertValid}
                    loading={insertLoading}
                    onConfirm={onInsertConfirm}
                    onCancel={onInsertCancel}
                />
            </div>
        )}

        {contextMenu && (
            <DatasetRowContextMenu
                state={contextMenu}
                deleting={deleteLoading}
                onInsertBelow={onInsertBelow}
                onAskDelete={onAskDelete}
                onConfirmDelete={onDeleteConfirm}
                onCancel={onMenuCancel}
            />
        )}
    </>
);
