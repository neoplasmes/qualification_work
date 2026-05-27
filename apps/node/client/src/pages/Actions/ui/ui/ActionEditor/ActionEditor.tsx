import { skipToken } from '@reduxjs/toolkit/query';
import { useCallback, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    useCreateActionMutation,
    useExecuteActionMutation,
    usePatchActionMutation,
} from '@/features/manageActions';

import { useArchiveActionMutation, type Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import {
    actionToDraft,
    canMutate,
    coerceRunValues,
    createBlankActionDraft,
    draftToActionPayload,
    getDefaultRunValues,
    validateRunValues,
} from '../../../lib';
import {
    cancelCreateAction,
    selectAction,
    selectActionsWorkspaceTab,
    setActionsWorkspaceTab,
    type ActionDraft,
    type ActionsWorkspaceTab,
} from '../../../model';

import { ConfigureForm } from '../ConfigureForm';
import { RunForm } from '../RunForm';
import { WorkspaceHeader } from '../WorkspaceHeader';
import { WorkspaceTabs } from '../WorkspaceTabs';
import { useActionDraftUpdaters } from './lib';

import styles from '../../ActionsPage.module.scss';

type ActionEditorProps = {
    selectedAction: Action | undefined;
    isCreatingAction: boolean;
    orgId: string | undefined;
    orgRole: string | undefined;
    refetchActions: () => unknown;
};

const CONFIGURE_FORM_ID = 'actions-configure-form';

export const ActionEditor = ({
    selectedAction,
    isCreatingAction,
    orgId,
    orgRole,
    refetchActions,
}: ActionEditorProps) => {
    const dispatch = useDispatch();
    const workspaceTab = useSelector(selectActionsWorkspaceTab);
    const [draft, setDraft] = useState<ActionDraft>(() =>
        selectedAction ? actionToDraft(selectedAction) : createBlankActionDraft()
    );
    const [runValues, setRunValues] = useState<Record<string, string>>(() =>
        selectedAction ? getDefaultRunValues(selectedAction.parameters) : {}
    );
    const [error, setError] = useState('');
    const [lastRunMessage, setLastRunMessage] = useState('');
    const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(
        null
    );

    const datasetsQuery = useListDatasetsQuery(orgId ?? skipToken);
    const editable = canMutate(orgRole);
    const [createAction, createState] = useCreateActionMutation();
    const [patchAction, patchState] = usePatchActionMutation();
    const [archiveAction, archiveState] = useArchiveActionMutation();
    const [executeAction, executeState] = useExecuteActionMutation();
    const { updateEffect, updateMapping, updateParameter } =
        useActionDraftUpdaters(setDraft);

    const handleSave = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!orgId || !editable) {
                return;
            }

            try {
                setError('');
                const payload = draftToActionPayload(draft);
                if (isCreatingAction) {
                    const created = await createAction({ orgId, ...payload }).unwrap();
                    dispatch(cancelCreateAction());
                    dispatch(selectAction(created.id));
                } else if (selectedAction) {
                    await patchAction({
                        actionId: selectedAction.id,
                        ...payload,
                    }).unwrap();
                    dispatch(selectAction(selectedAction.id));
                }
                await refetchActions();
            } catch (saveError) {
                setError(
                    saveError instanceof Error
                        ? saveError.message
                        : getApiErrorMessage(saveError, 'Unable to save this action.')
                );
            }
        },
        [
            createAction,
            dispatch,
            draft,
            editable,
            isCreatingAction,
            orgId,
            patchAction,
            refetchActions,
            selectedAction,
        ]
    );

    const handleArchive = useCallback(async () => {
        if (!selectedAction || !editable) {
            return;
        }

        if (archiveConfirmationId !== selectedAction.id) {
            setArchiveConfirmationId(selectedAction.id);

            return;
        }

        try {
            setError('');
            await archiveAction(selectedAction.id).unwrap();
            dispatch(selectAction(null));
            setArchiveConfirmationId(null);
            await refetchActions();
        } catch (archiveError) {
            setError(getApiErrorMessage(archiveError, 'Unable to archive this action.'));
        }
    }, [
        archiveAction,
        archiveConfirmationId,
        dispatch,
        editable,
        refetchActions,
        selectedAction,
    ]);

    const handleRename = useCallback(
        async (name: string) => {
            if (isCreatingAction) {
                setDraft(current => ({ ...current, name }));

                return;
            }
            if (!selectedAction || !editable) {
                return;
            }

            try {
                setError('');
                await patchAction({ actionId: selectedAction.id, name }).unwrap();
                setDraft(current => ({ ...current, name }));
                await refetchActions();
            } catch (renameError) {
                const message = getApiErrorMessage(
                    renameError,
                    'Unable to rename this action.'
                );
                setError(message);

                throw new Error(message);
            }
        },
        [editable, isCreatingAction, patchAction, refetchActions, selectedAction]
    );

    const handleRun = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!selectedAction || !editable) {
                return;
            }

            try {
                setError('');
                setLastRunMessage('');
                const validationError = validateRunValues(
                    selectedAction.parameters,
                    runValues
                );
                if (validationError) {
                    setError(validationError);

                    return;
                }

                const parameters = coerceRunValues(selectedAction.parameters, runValues);
                const result = await executeAction({
                    actionId: selectedAction.id,
                    parameters,
                }).unwrap();
                setLastRunMessage(
                    result.status === 'success'
                        ? `Run completed with ${result.changes.length} changes.`
                        : (result.errorMessage ?? 'Run failed.')
                );
            } catch (runError) {
                setError(
                    runError instanceof Error
                        ? runError.message
                        : getApiErrorMessage(runError, 'Unable to run this action.')
                );
            }
        },
        [editable, executeAction, runValues, selectedAction]
    );

    const handleRunValueChange = useCallback((key: string, value: string) => {
        setRunValues(current => ({ ...current, [key]: value }));
    }, []);

    const handleTabChange = useCallback(
        (tab: ActionsWorkspaceTab) => dispatch(setActionsWorkspaceTab(tab)),
        [dispatch]
    );

    const saving = createState.isLoading || patchState.isLoading;

    return (
        <section
            className={styles['workspace']}
            data-stack="v"
            data-gap="md"
            data-p="md"
            data-flex
            data-test-id={actionsTestIds.workspace}
            aria-label="Action details"
        >
            <WorkspaceHeader
                title={isCreatingAction ? draft.name : (selectedAction?.name ?? '')}
                isCreatingAction={isCreatingAction}
                selectedActionId={selectedAction?.id}
                archiveConfirmationId={archiveConfirmationId}
                archiveDisabled={!editable || archiveState.isLoading}
                editable={editable && isCreatingAction}
                saveDisabled={!editable || saving}
                saveFormId={
                    workspaceTab === 'configure' && editable
                        ? CONFIGURE_FORM_ID
                        : undefined
                }
                saving={saving}
                renaming={patchState.isLoading}
                onRename={handleRename}
                onCancelCreate={() => dispatch(cancelCreateAction())}
                onArchive={() => void handleArchive()}
            />

            <WorkspaceTabs
                activeTab={workspaceTab}
                runDisabled={isCreatingAction}
                onChange={handleTabChange}
            />

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            {!editable && (
                <StatusMessage>
                    Viewer role can inspect actions and history, but can not edit or run
                    them.
                </StatusMessage>
            )}

            {workspaceTab === 'configure' ? (
                <ConfigureForm
                    draft={draft}
                    datasets={datasetsQuery.data ?? []}
                    disabled={!editable || saving}
                    formId={CONFIGURE_FORM_ID}
                    onSubmit={handleSave}
                    onDraftChange={setDraft}
                    onUpdateParameter={updateParameter}
                    onUpdateEffect={updateEffect}
                    onUpdateMapping={updateMapping}
                />
            ) : (
                <RunForm
                    action={selectedAction}
                    runValues={runValues}
                    disabled={!editable || executeState.isLoading}
                    lastRunMessage={lastRunMessage}
                    onRunValueChange={handleRunValueChange}
                    onSubmit={handleRun}
                />
            )}
        </section>
    );
};
