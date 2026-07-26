import type { Action } from '@/core/entities/action';
import { Field, Input, Select, Text } from '@qualification-work/design-system';
import type { SubmitEvent } from 'react';

import { getValueTypePlaceholder } from '@/shared/lib/valueTypePlaceholder';
import { StatusMessage } from '@/shared/ui';

import { actionsTestIds } from '../../../../../../const';
import { isRunValueInputAllowed } from '../../../../../../lib';

import styles from './RunForm.module.css';

type RunFormProps = {
    action: Action | undefined;
    formId: string;
    runValues: Record<string, string>;
    disabled: boolean;
    lastRunMessage: string;
    runFailed?: boolean;
    onRunValueChange: (key: string, value: string) => void;
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
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
    runFailed,
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
                Сохраните действие перед запуском.
            </p>
        );
    }

    const visibleParameters = action.parameters.filter(parameter => !parameter.hidden);

    return (
        <form
            id={formId}
            className={styles['form']}
            data-stack="v"
            data-gap="md"
            data-test-id={actionsTestIds.runForm}
            onSubmit={onSubmit}
        >
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <Text
                        as="h3"
                        variant="heading-sm"
                        className={styles['section-title']}
                    >
                        Запуск действия
                    </Text>
                    <p>Заполните параметры и выполните действие.</p>
                </div>
            </div>

            {visibleParameters.length === 0 ? (
                <StatusMessage>Это действие не требует параметров.</StatusMessage>
            ) : (
                <div className={styles['run-grid']} data-stack="v" data-gap="sm">
                    {visibleParameters.map(parameter => (
                        <Field key={parameter.key} label={parameter.label}>
                            {parameter.type === 'bool' ? (
                                <Select
                                    data-test-id={actionsTestIds.runBoolSelect}
                                    required={parameter.required}
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    onChange={event =>
                                        onRunValueChange(
                                            parameter.key,
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Не задано</option>
                                    <option value="true">Да</option>
                                    <option value="false">Нет</option>
                                </Select>
                            ) : (
                                <Input
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
                        </Field>
                    ))}
                </div>
            )}

            {lastRunMessage && (
                <StatusMessage tone={runFailed ? 'error' : 'success'}>
                    {lastRunMessage}
                </StatusMessage>
            )}
        </form>
    );
};
