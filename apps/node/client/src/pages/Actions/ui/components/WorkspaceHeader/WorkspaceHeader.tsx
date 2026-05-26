import { Trash2 } from 'lucide-react';

import { Button, EntityHeader } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionDraft } from '../../../model';

type WorkspaceHeaderProps = {
    draft: ActionDraft;
    isCreatingAction: boolean;
    selectedActionName: string | undefined;
    selectedActionId: string | undefined;
    archiveConfirmationId: string | null;
    archiveDisabled: boolean;
    editable: boolean;
    onArchive: () => void;
};

export const WorkspaceHeader = ({
    draft,
    isCreatingAction,
    selectedActionName,
    selectedActionId,
    archiveConfirmationId,
    archiveDisabled,
    editable,
    onArchive,
}: WorkspaceHeaderProps) => (
    <EntityHeader
        eyebrow={isCreatingAction ? 'New action' : 'Action'}
        title={draft.name.trim() || selectedActionName || 'Untitled action'}
        description={`${draft.parameters.length} parameters, ${draft.effects.length} effects`}
        actions={
            !isCreatingAction && (
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
            )
        }
    />
);
