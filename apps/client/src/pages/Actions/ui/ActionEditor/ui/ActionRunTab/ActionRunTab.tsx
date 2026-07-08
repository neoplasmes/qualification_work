import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { useExecuteActionMutation } from '@/features/manageActions';

import type { Action } from '@/entities/action';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import { coerceRunValues, getDefaultRunValues, validateRunValues } from '../../../../lib';

import { RunForm } from './ui/RunForm';

type ActionRunTabProps = {
    action: Action | undefined;
    editable: boolean;
    formId: string;
    onRunningChange: (running: boolean) => void;
};

export const ActionRunTab = ({
    action,
    editable,
    formId,
    onRunningChange,
}: ActionRunTabProps) => {
    const [runValues, setRunValues] = useState<Record<string, string>>(() =>
        action ? getDefaultRunValues(action.parameters) : {}
    );
    const [error, setError] = useState('');
    const [lastRunMessage, setLastRunMessage] = useState('');
    const [executeAction, executeState] = useExecuteActionMutation();

    useEffect(() => {
        setRunValues(action ? getDefaultRunValues(action.parameters) : {});
        setError('');
        setLastRunMessage('');
    }, [action?.id, action?.parameters]);

    useEffect(() => {
        onRunningChange(executeState.isLoading);
    }, [executeState.isLoading, onRunningChange]);

    const handleRunValueChange = useCallback((key: string, value: string) => {
        setRunValues(current => ({ ...current, [key]: value }));
    }, []);

    const handleRun = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!action || !editable) {
                return;
            }

            try {
                setError('');
                setLastRunMessage('');

                const validationError = validateRunValues(action.parameters, runValues);

                if (validationError) {
                    setError(validationError);

                    return;
                }

                const parameters = coerceRunValues(action.parameters, runValues);
                const result = await executeAction({
                    actionId: action.id,
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
        [action, editable, executeAction, runValues]
    );

    return (
        <>
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            <RunForm
                action={action}
                formId={formId}
                runValues={runValues}
                disabled={!editable || executeState.isLoading}
                lastRunMessage={lastRunMessage}
                onRunValueChange={handleRunValueChange}
                onSubmit={handleRun}
            />
        </>
    );
};
