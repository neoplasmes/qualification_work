import { IconButton } from '@qualification-work/design-system';
import { ArrowDown } from 'lucide-react';

import { datasetsTestIds } from '../../../../const';
import {
    DatasetColumnContextMenu,
    type DatasetColumnContextMenuState,
} from '../../../DatasetColumnContextMenu';
import {
    DatasetRowContextMenu,
    type DatasetRowContextMenuState,
} from '../../../DatasetRowContextMenu';

import styles from '../../datasetWorkspace.module.css';

type DatasetWorkspaceOverlaysProps = {
    contextMenu: DatasetRowContextMenuState | null;
    columnContextMenu: DatasetColumnContextMenuState | null;
    deleteLoading: boolean;
    clearLoading: boolean;
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
    clearLoading,
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
                clearing={clearLoading}
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
                    aria-label="Перейти к последней строке"
                    data-p="sm"
                    onClick={onScrollToBottom}
                >
                    <ArrowDown size={18} />
                </IconButton>
            </div>
        )}
    </>
);
