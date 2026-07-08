import { ArrowDown } from 'lucide-react';

import { IconButton } from '@/shared/ui';

import { datasetsTestIds } from '../../../../const';
import {
    DatasetColumnContextMenu,
    type DatasetColumnContextMenuState,
} from '../../../DatasetColumnContextMenu';
import {
    DatasetRowContextMenu,
    type DatasetRowContextMenuState,
} from '../../../DatasetRowContextMenu';

import styles from '../../DatasetWorkspace.module.scss';

type DatasetWorkspaceOverlaysProps = {
    contextMenu: DatasetRowContextMenuState | null;
    columnContextMenu: DatasetColumnContextMenuState | null;
    deleteLoading: boolean;
    columnToggleLoading: boolean;
    showScrollToBottom: boolean;
    onScrollToBottom: () => void;
    onInsertBelow: () => void;
    onClearSelected: () => void;
    onAskDelete: () => void;
    onDeleteConfirm: () => void;
    onColumnAnalysisToggle: (
        column: DatasetColumnContextMenuState['column'],
        value: boolean
    ) => void;
    onMenuCancel: () => void;
};

export const DatasetWorkspaceOverlays = ({
    contextMenu,
    columnContextMenu,
    deleteLoading,
    columnToggleLoading,
    showScrollToBottom,
    onScrollToBottom,
    onInsertBelow,
    onClearSelected,
    onAskDelete,
    onDeleteConfirm,
    onColumnAnalysisToggle,
    onMenuCancel,
}: DatasetWorkspaceOverlaysProps) => (
    <>
        {contextMenu && (
            <DatasetRowContextMenu
                state={contextMenu}
                deleting={deleteLoading}
                onInsertBelow={onInsertBelow}
                onClearSelected={onClearSelected}
                onAskDelete={onAskDelete}
                onConfirmDelete={onDeleteConfirm}
                onCancel={onMenuCancel}
            />
        )}

        {columnContextMenu && (
            <DatasetColumnContextMenu
                state={columnContextMenu}
                disabled={columnToggleLoading}
                onToggleAnalysis={onColumnAnalysisToggle}
                onCancel={onMenuCancel}
            />
        )}

        {showScrollToBottom && (
            <div className={styles['scroll-bottom-anchor']}>
                <IconButton
                    data-test-id={datasetsTestIds.scrollToBottomButton}
                    className={styles['scroll-bottom']}
                    aria-label="Scroll to end"
                    data-p="sm"
                    onClick={onScrollToBottom}
                >
                    <ArrowDown size={18} />
                </IconButton>
            </div>
        )}
    </>
);
