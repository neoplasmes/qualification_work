import { skipToken } from '@reduxjs/toolkit/query';
import { Play, Save, X } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import {
    useCreateActionMutation,
    useExecuteActionMutation,
    usePatchActionMutation,
} from '@/features/manageActions';

import type { Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { Button, Separator, StatusMessage } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import {
    actionToDraft,
    canMutate,
    coerceRunValues,
    createBlankActionDraft,
    draftToActionPayload,
    getActionWorkspaceUrl,
    getDefaultRunValues,
    validateRunValues,
} from '../../../lib';
import {
    cancelCreateAction,
    selectAction,
    selectActionsWorkspaceMode,
    setActionsWorkspaceMode,
    type ActionDraft,
    type ActionsWorkspaceMode,
} from '../../../model';

import { ConfigureForm } from '../ConfigureForm';
import { RunForm } from '../RunForm';
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

const configureFormId = 'actions-configure-form';
const runFormId = 'actions-run-form';

export const ActionEditor = ({
    selectedAction,
    isCreatingAction,
    orgId,
    orgRole,
    refetchActions,
}: ActionEditorProps) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const workspaceMode = useSelector(selectActionsWorkspaceMode);
    const [draft, setDraft] = useState<ActionDraft>(() =>
        selectedAction ? actionToDraft(selectedAction) : createBlankActionDraft()
    );
    const [runValues, setRunValues] = useState<Record<string, string>>(() =>
        selectedAction ? getDefaultRunValues(selectedAction.parameters) : {}
    );
    const [error, setError] = useState('');
    const [lastRunMessage, setLastRunMessage] = useState('');

    const datasetsQuery = useListDatasetsQuery(orgId ?? skipToken);
    const editable = canMutate(orgRole);
    const [createAction, createState] = useCreateActionMutation();
    const [patchAction, patchState] = usePatchActionMutation();
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
                    navigate(getActionWorkspaceUrl(created.id, 'view'));
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
            navigate,
            orgId,
            patchAction,
            refetchActions,
            selectedAction,
        ]
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
        (mode: ActionsWorkspaceMode) => {
            dispatch(setActionsWorkspaceMode(mode));

            if (selectedAction) {
                navigate(getActionWorkspaceUrl(selectedAction.id, mode));
            }
        },
        [dispatch, navigate, selectedAction]
    );

    const saving = createState.isLoading || patchState.isLoading;
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
            <div
                className={styles['top-line-block']}
                data-stack="h"
                data-align="center"
                data-justify="between"
            >
                <h2 className={styles['title']}>{workspaceTitle}</h2>
                <div data-stack="h" data-gap="sm" data-align="center">
                    {saveFormId ? (
                        <Button
                            type="submit"
                            form={saveFormId}
                            size="sm"
                            data-test-id={actionsTestIds.saveButton}
                            disabled={!editable || saving}
                            isLoading={saving}
                        >
                            <Save size={16} />
                            Save
                        </Button>
                    ) : null}
                    {workspaceMode === 'view' && selectedAction ? (
                        <Button
                            type="submit"
                            form={runFormId}
                            size="sm"
                            data-test-id={actionsTestIds.runButton}
                            disabled={!editable || executeState.isLoading}
                            isLoading={executeState.isLoading}
                        >
                            <Play size={16} />
                            Run
                        </Button>
                    ) : null}
                    {isCreatingAction ? (
                        <Button
                            data-test-id={actionsTestIds.cancelCreateButton}
                            onClick={() => dispatch(cancelCreateAction())}
                        >
                            <X size={18} />
                            Cancel
                        </Button>
                    ) : null}
                </div>
            </div>

            <Separator />

            <WorkspaceTabs
                activeTab={workspaceMode}
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

            {workspaceMode === 'edit' ? (
                <ConfigureForm
                    draft={draft}
                    datasets={datasetsQuery.data ?? []}
                    disabled={!editable || saving}
                    formId={configureFormId}
                    onSubmit={handleSave}
                    onDraftChange={setDraft}
                    onUpdateParameter={updateParameter}
                    onUpdateEffect={updateEffect}
                    onUpdateMapping={updateMapping}
                />
            ) : (
                <RunForm
                    action={selectedAction}
                    formId={runFormId}
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
