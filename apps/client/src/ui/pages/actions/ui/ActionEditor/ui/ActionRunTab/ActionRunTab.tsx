import type { Action } from '@/core/entities/action';
import { useDependencies } from '@/ui/di/dependencies';
import { Button, Notice } from '@qualification-work/design-system';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { getApiErrorMessage } from '@/shared/api';
import { StatusMessage } from '@/shared/ui';

import styles from '../../../../actions.page.module.css';
import { coerceRunValues, getDefaultRunValues, validateRunValues } from '../../../../lib';
import { useActionsController } from '../../../../model';
import { ActionRunDetails } from '../../../ActionRunDetails';

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
    const { executeAction, org } = useActionsController();
    const dependencies = useDependencies();

    useEffect(() => {
        onRunningChange(executeAction.isPending);
    }, [executeAction.isPending, onRunningChange]);

    const handleRunValueChange = useCallback((key: string, value: string) => {
        setRunValues(current => ({ ...current, [key]: value }));
    }, []);

    const handleRun = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!action || !editable || executeAction.isPending) {
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
                const result = await executeAction.execute({
                    orgId: action.orgId,
                    actionId: action.id,
                    parameters,
                });

                setLastRunMessage(
                    result.status === 'success'
                        ? `Выполнено. Изменений: ${result.changes.length}.`
                        : (result.errorMessage ?? 'Run failed.')
                );
            } catch (runError) {
                setError(
                    runError instanceof Error
                        ? 'payload' in runError
                            ? getApiErrorMessage(
                                  { data: runError.payload },
                                  runError.message
                              )
                            : runError.message
                        : getApiErrorMessage(runError, 'Unable to run this action.')
                );
            }
        },
        [action, editable, executeAction, runValues]
    );

    return (
        <>
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            {Boolean(executeAction.syncError) && (
                <Notice role="status">
                    Выполнение подтверждено, но обновление данных не удалось.
                </Notice>
            )}
            {(Boolean(executeAction.syncError) || Boolean(error)) && (
                <Button
                    variant="ghost"
                    onClick={async () => {
                        try {
                            await dependencies.cache.read(dependencies.listActionRuns, {
                                kind: 'org',
                                orgId: org!.id,
                                offset: 0,
                                limit: 50,
                            });
                        } catch {
                            setError('Не удалось обновить журнал. Повторите чтение.');
                        }
                    }}
                >
                    Обновить журнал
                </Button>
            )}
            <div className={styles['run-layout']}>
                <RunForm
                    action={action}
                    formId={formId}
                    runValues={runValues}
                    disabled={!editable || executeAction.isPending}
                    lastRunMessage={lastRunMessage}
                    runFailed={executeAction.data?.status === 'failed'}
                    onRunValueChange={handleRunValueChange}
                    onSubmit={handleRun}
                />
                {executeAction.data && <ActionRunDetails run={executeAction.data} />}
            </div>
        </>
    );
};
