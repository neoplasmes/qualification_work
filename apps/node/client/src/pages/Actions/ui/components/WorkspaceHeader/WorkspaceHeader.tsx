import { Trash2 } from 'lucide-react';

import { Button } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionDraft } from '../../../model';

import styles from '../../ActionsPage.module.scss';

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
    <div className={styles['header-row']}>
        <div data-stack="v" data-gap="xs">
            <span className={styles['eyebrow']}>
                {isCreatingAction ? 'New action' : 'Action'}
            </span>
            <h2 className={styles['title']}>
                {draft.name.trim() || selectedActionName || 'Untitled action'}
            </h2>
            <p className={styles['muted']}>
                {draft.parameters.length} parameters, {draft.effects.length} effects
            </p>
        </div>
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
