import { Trash2 } from 'lucide-react';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { Button } from '@/shared/ui';

import { actionsTestIds } from '../../../const';

type WorkspaceHeaderProps = {
    title: string;
    meta: string;
    isCreatingAction: boolean;
    selectedActionId: string | undefined;
    archiveConfirmationId: string | null;
    archiveDisabled: boolean;
    editable: boolean;
    renaming: boolean;
    onRename: (name: string) => Promise<void> | void;
    onArchive: () => void;
};

export const WorkspaceHeader = ({
    title,
    meta,
    isCreatingAction,
    selectedActionId,
    archiveConfirmationId,
    archiveDisabled,
    editable,
    renaming,
    onRename,
    onArchive,
}: WorkspaceHeaderProps) => (
    <div data-stack="h" data-align="start" data-justify="between">
        <WorkspaceTitleEditor
            eyebrow={isCreatingAction ? 'New action' : 'Action'}
            title={title}
            fallbackTitle="Untitled action"
            meta={meta}
            editable={editable}
            saving={renaming}
            editButtonTestId={actionsTestIds.renameButton}
            inputTestId={actionsTestIds.renameInput}
            onRename={onRename}
        />
        {!isCreatingAction && (
            <Button
                variant="danger"
                data-test-id={actionsTestIds.archiveButton}
                disabled={archiveDisabled}
                title={
                    editable ? undefined : 'Only owners and editors can archive actions.'
                }
                onClick={onArchive}
            >
                <Trash2 size={18} />
                {archiveConfirmationId === selectedActionId
                    ? 'Confirm archive'
                    : 'Archive'}
            </Button>
        )}
    </div>
);
