import { Save, X } from 'lucide-react';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { Button } from '@/shared/ui';

import { actionsTestIds } from '../../../const';

type WorkspaceHeaderProps = {
    title: string;
    isCreatingAction: boolean;
    editable: boolean;
    saveDisabled: boolean;
    saveFormId: string | undefined;
    saving: boolean;
    renaming: boolean;
    onRename: (name: string) => Promise<void> | void;
    onCancelCreate: () => void;
};

export const WorkspaceHeader = ({
    title,
    isCreatingAction,
    editable,
    saveDisabled,
    saveFormId,
    saving,
    renaming,
    onRename,
    onCancelCreate,
}: WorkspaceHeaderProps) => (
    <div data-stack="h" data-align="end" data-justify="between">
        <WorkspaceTitleEditor
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
            ) : null}
        </div>
    </div>
);
