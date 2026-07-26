import type { Action } from '@/core/entities/action';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import {
    ActionBuilder,
    builderDraftToActionPayload,
    type ActionBuilderDraft,
} from '@/ui/pages/actions/ui/ActionBuilder';
import { Button, Notice } from '@qualification-work/design-system';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type FormEvent,
    type SetStateAction,
} from 'react';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import { useActionsController } from '../../../../model';

type ActionConfigureTabProps = {
    draft: ActionBuilderDraft;
    editable: boolean;
    formId: string;
    isCreatingAction: boolean;
    orgId: string | undefined;
    selectedAction: Action | undefined;
    onActionCreated: (actionId: string) => Promise<void> | void;
    onActionUpdated: (actionId: string) => Promise<void> | void;
    onDraftChange: Dispatch<SetStateAction<ActionBuilderDraft>>;
    onSavingChange: (saving: boolean) => void;
};

export const ActionConfigureTab = ({
    draft,
    editable,
    formId,
    isCreatingAction,
    orgId,
    selectedAction,
    onActionCreated,
    onActionUpdated,
    onDraftChange,
    onSavingChange,
}: ActionConfigureTabProps) => {
    const { createAction, updateAction } = useActionsController();
    const [syncError, setSyncError] = useState(false);
    const [confirmedId, setConfirmedId] = useState<string>();
    const dependencies = useDependencies();
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: orgId ?? '' },
        { enabled: Boolean(orgId) }
    );
    const saving = createAction.isPending || updateAction.isPending;
    const [error, setError] = useState('');
    const live = useRef(true);

    useEffect(() => {
        live.current = true;

        return () => {
            live.current = false;
        };
    }, []);

    useEffect(() => {
        onSavingChange(saving);
    }, [onSavingChange, saving]);

    const handleSave = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!orgId || !editable || saving || confirmedId) {
                return;
            }

            try {
                setError('');
                const payload = builderDraftToActionPayload(draft);

                if (isCreatingAction) {
                    const outcome = await createAction.executeOutcome({
                        orgId,
                        ...payload,
                    });
                    if (!live.current) {
                        return;
                    }
                    setConfirmedId(outcome.data.id);
                    setSyncError(Boolean(outcome.syncError));
                    if (!outcome.syncError) {
                        await onActionCreated(outcome.data.id);
                    }
                } else if (selectedAction) {
                    const outcome = await updateAction.executeOutcome({
                        orgId,
                        actionId: selectedAction.id,
                        ...payload,
                    });
                    if (!live.current) {
                        return;
                    }
                    setSyncError(Boolean(outcome.syncError));
                    await onActionUpdated(selectedAction.id);
                }
            } catch (saveError) {
                if (!live.current) {
                    return;
                }
                setError(
                    saveError instanceof Error
                        ? saveError.message
                        : getApiErrorMessage(saveError, 'Unable to save this action.')
                );
            }
        },
        [
            createAction,
            draft,
            editable,
            isCreatingAction,
            onActionCreated,
            onActionUpdated,
            orgId,
            updateAction,
            saving,
            confirmedId,
            selectedAction,
        ]
    );

    return (
        <>
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            {syncError && (
                <Notice role="status">
                    Действие сохранено, но обновить экран не удалось.{' '}
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            try {
                                await dependencies.cache.read(dependencies.listActions, {
                                    orgId: orgId!,
                                });
                                if (!live.current) {
                                    return;
                                }
                                setSyncError(false);
                                if (confirmedId) {
                                    await onActionCreated(confirmedId);
                                }
                            } catch {
                                if (live.current) {
                                    setSyncError(true);
                                }
                            }
                        }}
                    >
                        Обновить данные
                    </Button>
                </Notice>
            )}
            <ActionBuilder
                value={draft}
                datasets={datasetsQuery.data ?? []}
                disabled={!editable || saving || Boolean(confirmedId)}
                formId={formId}
                onChange={onDraftChange}
                onSubmit={handleSave}
            />
        </>
    );
};
