import { ArrowDown } from 'lucide-react';

import { IconButton } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import type { InsertRowDraft } from '../DatasetGrid/types';
import {
    DatasetRowContextMenu,
    type DatasetRowContextMenuState,
} from '../DatasetRowContextMenu';
import { NewRowActions } from '../NewRowActions';

import styles from './DatasetPreview.module.scss';

type DatasetPreviewOverlaysProps = {
    insertDraft: InsertRowDraft | null;
    draftRowTop: number | null;
    contextMenu: DatasetRowContextMenuState | null;
    insertValid: boolean;
    insertLoading: boolean;
    deleteLoading: boolean;
    showScrollToBottom: boolean;
    onScrollToBottom: () => void;
    onInsertConfirm: () => void;
    onInsertCancel: () => void;
    onInsertBelow: () => void;
    onAskDelete: () => void;
    onDeleteConfirm: () => void;
    onMenuCancel: () => void;
};

export const DatasetPreviewOverlays = ({
    insertDraft,
    draftRowTop,
    contextMenu,
    insertValid,
    insertLoading,
    deleteLoading,
    showScrollToBottom,
    onScrollToBottom,
    onInsertConfirm,
    onInsertCancel,
    onInsertBelow,
    onAskDelete,
    onDeleteConfirm,
    onMenuCancel,
}: DatasetPreviewOverlaysProps) => (
    <>
        {insertDraft && draftRowTop !== null && (
            <div className={styles['floating-actions']} style={{ top: draftRowTop }}>
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

        {showScrollToBottom && (
            <div className={styles['scroll-bottom-anchor']}>
                <IconButton
                    data-test-id={datasetsTestIds.scrollToBottomButton}
                    className={styles['scroll-bottom']}
                    aria-label="Scroll to end"
                    onClick={onScrollToBottom}
                >
                    <ArrowDown size={18} />
                </IconButton>
            </div>
        )}
    </>
);
