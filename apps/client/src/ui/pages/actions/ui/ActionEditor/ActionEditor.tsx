import { useActionsPageActions, useActionsPageState } from '@/ui/pages/actions/model';
import { Button, Divider } from '@qualification-work/design-system';
import { Play, Save, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import {
    actionToBuilderDraft,
    createActionBuilderDraft,
    type ActionBuilderDraft,
} from '@/widgets/ActionBuilder';

import type { Action } from '@/entities/action';

import { StatusMessage } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { canMutate, getActionWorkspaceUrl } from '../../lib';
import { type ActionsWorkspaceMode } from '../../model';
import { WorkspaceTabs } from '../WorkspaceTabs';
import { ActionConfigureTab } from './ui/ActionConfigureTab';
import { ActionRunTab } from './ui/ActionRunTab';

import styles from '../../actions.page.module.css';

type ActionEditorProps = {
    selectedAction: Action | undefined;
    isCreatingAction: boolean;
    orgId: string | undefined;
    orgRole: string | undefined;
    refetchActions: () => unknown;
};

const configureFormId = 'actions-configure-form';
const runFormId = 'actions-run-form';

export const ActionEditor = ({
    selectedAction,
    isCreatingAction,
    orgId,
    orgRole,
    refetchActions,
}: ActionEditorProps) => {
    const { cancelCreateAction, selectAction, setActionsWorkspaceMode } =
        useActionsPageActions();
    const navigate = useNavigate();
    const workspaceMode = useActionsPageState(state => state.workspaceMode);
    const [draft, setDraft] = useState<ActionBuilderDraft>(() =>
        selectedAction ? actionToBuilderDraft(selectedAction) : createActionBuilderDraft()
    );
    const [configureSaving, setConfigureSaving] = useState(false);
    const [runExecuting, setRunExecuting] = useState(false);

    const editable = canMutate(orgRole);

    const handleActionCreated = useCallback(
        async (actionId: string) => {
            cancelCreateAction();
            selectAction(actionId);
            navigate(getActionWorkspaceUrl(actionId, 'view'));
            await refetchActions();
        },
        [navigate, refetchActions]
    );

    const handleActionUpdated = useCallback(
        async (actionId: string) => {
            selectAction(actionId);
            await refetchActions();
        },
        [refetchActions]
    );

    const handleTabChange = useCallback(
        (mode: ActionsWorkspaceMode) => {
            setActionsWorkspaceMode(mode);

            if (selectedAction) {
                navigate(getActionWorkspaceUrl(selectedAction.id, mode));
            }
        },
        [navigate, selectedAction]
    );

    const saveFormId = workspaceMode === 'edit' && editable ? configureFormId : undefined;
    const workspaceTitle =
        (isCreatingAction ? draft.name : (selectedAction?.name ?? '')).trim() ||
        'Untitled action';

    return (
        <section
            className={styles['workspace']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={actionsTestIds.workspace}
            aria-label="Action details"
        >
            <div className={styles['top-line-block']} data-stack="h" data-align="center">
                <h2 className={styles['title']}>{workspaceTitle}</h2>
            </div>

            <Divider />

            <div
                className={styles['tabs-row']}
                data-stack="h"
                data-gap="sm"
                data-align="center"
            >
                <WorkspaceTabs
                    activeTab={workspaceMode}
                    runDisabled={isCreatingAction}
                    onChange={handleTabChange}
                />
                <div
                    className={styles['tabs-actions']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    {saveFormId ? (
                        <Button
                            type="submit"
                            form={saveFormId}
                            size="regular"
                            data-test-id={actionsTestIds.saveButton}
                            disabled={!editable || configureSaving || configureSaving}
                            aria-busy={configureSaving}
                        >
                            <Save size={16} />
                            Save
                        </Button>
                    ) : null}
                    {workspaceMode === 'view' && selectedAction ? (
                        <Button
                            type="submit"
                            form={runFormId}
                            size="regular"
                            data-test-id={actionsTestIds.runButton}
                            disabled={!editable || runExecuting || runExecuting}
                            aria-busy={runExecuting}
                        >
                            <Play size={16} />
                            Run
                        </Button>
                    ) : null}
                    {isCreatingAction ? (
                        <Button
                            size="regular"
                            data-test-id={actionsTestIds.cancelCreateButton}
                            onClick={() => cancelCreateAction()}
                        >
                            <X size={16} />
                            Cancel
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className={styles['scroll-area']} data-stack="v" data-gap="sm" data-flex>
                {!editable && (
                    <StatusMessage>
                        Viewer role can inspect actions and history, but can not edit or
                        run them.
                    </StatusMessage>
                )}

                {workspaceMode === 'edit' ? (
                    <ActionConfigureTab
                        draft={draft}
                        editable={editable}
                        formId={configureFormId}
                        isCreatingAction={isCreatingAction}
                        orgId={orgId}
                        selectedAction={selectedAction}
                        onActionCreated={handleActionCreated}
                        onActionUpdated={handleActionUpdated}
                        onDraftChange={setDraft}
                        onSavingChange={setConfigureSaving}
                    />
                ) : (
                    <ActionRunTab
                        action={selectedAction}
                        editable={editable}
                        formId={runFormId}
                        onRunningChange={setRunExecuting}
                    />
                )}
            </div>
        </section>
    );
};
