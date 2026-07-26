import type { Action } from '@/core/entities/action';
import { useActionsPageActions, useActionsPageState } from '@/ui/pages/actions/model';
import { Button, Divider, Text } from '@qualification-work/design-system';
import { Play, Save, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import { StatusMessage } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { canMutate, getActionWorkspaceUrl } from '../../lib';
import { useActionDraft, type ActionsWorkspaceMode } from '../../model';
import { WorkspaceTabs } from '../WorkspaceTabs';
import { ActionConfigureTab } from './ui/ActionConfigureTab';
import { ActionRunTab } from './ui/ActionRunTab';

import styles from '../../actions.page.module.css';

type ActionEditorProps = {
    selectedAction: Action | undefined;
    isCreatingAction: boolean;
    orgId: string | undefined;
    orgRole: string | undefined;
};

const configureFormId = 'actions-configure-form';
const runFormId = 'actions-run-form';

export const ActionEditor = ({
    selectedAction,
    isCreatingAction,
    orgId,
    orgRole,
}: ActionEditorProps) => {
    const { cancelCreateAction, selectAction, setActionsWorkspaceMode } =
        useActionsPageActions();
    const navigate = useNavigate();
    const workspaceMode = useActionsPageState(state => state.workspaceMode);
    const { draft, setDraft } = useActionDraft(selectedAction);
    const [configureSaving, setConfigureSaving] = useState(false);
    const [runExecuting, setRunExecuting] = useState(false);

    const editable = canMutate(orgRole);

    const handleActionCreated = useCallback(
        async (actionId: string) => {
            cancelCreateAction();
            selectAction(actionId);
            navigate(getActionWorkspaceUrl(actionId, 'view'));
        },
        [navigate, cancelCreateAction, selectAction]
    );

    const handleActionUpdated = useCallback(
        async (actionId: string) => {
            selectAction(actionId);
        },
        [selectAction]
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
        'Без названия';

    return (
        <section
            className={styles['workspace']}
            data-stack="v"
            data-gap="sm"
            data-flex
            data-test-id={actionsTestIds.workspace}
            aria-label="Действие"
        >
            <div className={styles['top-line-block']} data-stack="h" data-align="center">
                <Text as="h2" variant="heading" className={styles['title']}>
                    {workspaceTitle}
                </Text>
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
                            disabled={!editable || configureSaving}
                            aria-busy={configureSaving}
                        >
                            <Save size={16} />
                            {configureSaving ? 'Сохранение…' : 'Сохранить'}
                        </Button>
                    ) : null}
                    {workspaceMode === 'view' && selectedAction ? (
                        <Button
                            type="submit"
                            form={runFormId}
                            size="regular"
                            data-test-id={actionsTestIds.runButton}
                            disabled={!editable || runExecuting}
                            aria-busy={runExecuting}
                        >
                            <Play size={16} />
                            {runExecuting ? 'Выполнение…' : selectedAction.name}
                        </Button>
                    ) : null}
                    {isCreatingAction ? (
                        <Button
                            size="regular"
                            data-test-id={actionsTestIds.cancelCreateButton}
                            onClick={() => cancelCreateAction()}
                        >
                            <X size={16} />
                            Отмена
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className={styles['scroll-area']} data-stack="v" data-gap="sm" data-flex>
                {!editable && (
                    <StatusMessage>
                        Вы можете просматривать действия и журнал. Изменение и запуск
                        доступны владельцам и редакторам.
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
