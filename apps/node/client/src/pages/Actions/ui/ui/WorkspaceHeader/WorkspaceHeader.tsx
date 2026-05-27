import { Save, Trash2, X } from 'lucide-react';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { Button } from '@/shared/ui';

import { actionsTestIds } from '../../../const';

type WorkspaceHeaderProps = {
    title: string;
    isCreatingAction: boolean;
    selectedActionId: string | undefined;
    archiveConfirmationId: string | null;
    archiveDisabled: boolean;
    editable: boolean;
    saveDisabled: boolean;
    saveFormId: string | undefined;
    saving: boolean;
    renaming: boolean;
    onRename: (name: string) => Promise<void> | void;
    onCancelCreate: () => void;
    onArchive: () => void;
};

export const WorkspaceHeader = ({
    title,
    isCreatingAction,
    selectedActionId,
    archiveConfirmationId,
    archiveDisabled,
    editable,
    saveDisabled,
    saveFormId,
    saving,
    renaming,
    onRename,
    onCancelCreate,
    onArchive,
}: WorkspaceHeaderProps) => (
    <div data-stack="h" data-align="end" data-justify="between">
        <WorkspaceTitleEditor
            eyebrow={isCreatingAction ? 'New action' : 'Action'}
            title={title}
            fallbackTitle="Untitled action"
            editable={editable}
            saving={renaming}
            editButtonTestId={actionsTestIds.renameButton}
            inputTestId={actionsTestIds.renameInput}
            onRename={onRename}
        />
        <div data-stack="h" data-gap="sm" data-align="center">
            {saveFormId && (
                <Button
                    type="submit"
                    form={saveFormId}
                    data-test-id={actionsTestIds.saveButton}
                    disabled={saveDisabled}
                    isLoading={saving}
                >
                    <Save size={18} />
                    Save
                </Button>
            )}
            {isCreatingAction ? (
                <Button
                    data-test-id={actionsTestIds.cancelCreateButton}
                    onClick={onCancelCreate}
                >
                    <X size={18} />
                    Cancel
                </Button>
            ) : (
                <Button
                    variant="danger"
                    data-test-id={actionsTestIds.archiveButton}
                    disabled={archiveDisabled}
                    title={
                        editable
                            ? undefined
                            : 'Only owners and editors can archive actions.'
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
    </div>
);
