import { skipToken } from '@reduxjs/toolkit/query';
import {
    useCallback,
    useEffect,
    useState,
    type Dispatch,
    type FormEvent,
    type SetStateAction,
} from 'react';

import {
    ActionBuilder,
    builderDraftToActionPayload,
    type ActionBuilderDraft,
} from '@/widgets/ActionBuilder';

import {
    useCreateActionMutation,
    usePatchActionMutation,
} from '@/features/manageActions';

import type { Action } from '@/entities/action';
import { useListDatasetsQuery } from '@/entities/dataset';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

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
    const [createAction, createState] = useCreateActionMutation();
    const [patchAction, patchState] = usePatchActionMutation();
    const datasetsQuery = useListDatasetsQuery(orgId ?? skipToken);
    const saving = createState.isLoading || patchState.isLoading;
    const [error, setError] = useState('');

    useEffect(() => {
        onSavingChange(saving);
    }, [onSavingChange, saving]);

    const handleSave = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!orgId || !editable) {
                return;
            }

            try {
                setError('');
                const payload = builderDraftToActionPayload(draft);

                if (isCreatingAction) {
                    const created = await createAction({ orgId, ...payload }).unwrap();

                    await onActionCreated(created.id);
                } else if (selectedAction) {
                    await patchAction({
                        actionId: selectedAction.id,
                        ...payload,
                    }).unwrap();
                    await onActionUpdated(selectedAction.id);
                }
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
            draft,
            editable,
            isCreatingAction,
            onActionCreated,
            onActionUpdated,
            orgId,
            patchAction,
            selectedAction,
        ]
    );

    return (
        <>
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            <ActionBuilder
                value={draft}
                datasets={datasetsQuery.data ?? []}
                disabled={!editable || saving}
                formId={formId}
                onChange={onDraftChange}
                onSubmit={handleSave}
            />
        </>
    );
};
