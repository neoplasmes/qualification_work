import type { FormEvent } from 'react';

import type { Action } from '@/entities/action';

import { getValueTypePlaceholder } from '@/shared/lib/valueTypePlaceholder';
import { FormField, Select, StatusMessage, TextInput } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import { isRunValueInputAllowed } from '../../../lib';

import styles from './RunForm.module.scss';

type RunFormProps = {
    action: Action | undefined;
    formId: string;
    runValues: Record<string, string>;
    disabled: boolean;
    lastRunMessage: string;
    onRunValueChange: (key: string, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const getRunInputMode = (type: Action['parameters'][number]['type']) => {
    if (type === 'number') {
        return 'decimal';
    }
    if (type === 'date') {
        return 'numeric';
    }

    return undefined;
};

export const RunForm = ({
    action,
    formId,
    runValues,
    disabled,
    lastRunMessage,
    onRunValueChange,
    onSubmit,
}: RunFormProps) => {
    if (!action) {
        return (
            <p
                className={styles['placeholder']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-flex
            >
                Save an action before running it.
            </p>
        );
    }

    return (
        <form
            id={formId}
            className={styles['form']}
            data-display="grid"
            data-gap="md"
            data-test-id={actionsTestIds.runForm}
            onSubmit={onSubmit}
        >
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <h3 className={styles['section-title']}>Run action</h3>
                    <p>Enter parameters and execute this business operation.</p>
                </div>
            </div>

            {action.parameters.length === 0 ? (
                <StatusMessage>This action has no parameters.</StatusMessage>
            ) : (
                <div className={styles['run-grid']} data-display="grid" data-gap="sm">
                    {action.parameters.map(parameter => (
                        <FormField key={parameter.key} label={parameter.label}>
                            {parameter.type === 'bool' ? (
                                <Select
                                    data-test-id={actionsTestIds.runBoolSelect}
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    onChange={event =>
                                        onRunValueChange(
                                            parameter.key,
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Empty</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </Select>
                            ) : (
                                <TextInput
                                    data-test-id={actionsTestIds.runInput}
                                    type="text"
                                    inputMode={getRunInputMode(parameter.type)}
                                    placeholder={getValueTypePlaceholder(parameter.type)}
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    required={parameter.required}
                                    onChange={event => {
                                        const nextValue = event.target.value;
                                        if (
                                            isRunValueInputAllowed(
                                                parameter.type,
                                                nextValue
                                            )
                                        ) {
                                            onRunValueChange(parameter.key, nextValue);
                                        }
                                    }}
                                />
                            )}
                        </FormField>
                    ))}
                </div>
            )}

            {lastRunMessage && (
                <StatusMessage tone="success">{lastRunMessage}</StatusMessage>
            )}
        </form>
    );
};
