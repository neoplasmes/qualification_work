import { Checkbox, Field, IconButton } from '@qualification-work/design-system';
import { X } from 'lucide-react';

import { actionBuilderTestIds } from '../../const';
import {
    actionBuilderConfig,
    createParameterFieldBind,
    type ActionParameterDraft,
} from '../../model';

import styles from './parameterRow.module.css';

type ParameterRowProps = {
    parametersCount: number;
    parameter: ActionParameterDraft;
    disabled: boolean;
};

export const ParameterRow = ({
    parametersCount,
    parameter,
    disabled,
}: ParameterRowProps) => {
    const snapshot = actionBuilderConfig.useConfig();

    const labelBind = createParameterFieldBind(parameter.id, 'label');
    const typeBind = createParameterFieldBind(parameter.id, 'type');
    const requiredBind = createParameterFieldBind(parameter.id, 'required');
    const keyBind = createParameterFieldBind(parameter.id, 'key');

    const handleRemoveParameter = () => {
        snapshot.mutateDraft(draft => {
            draft.parameters = draft.parameters.filter(item => item.id !== parameter.id);
        });
    };

    return (
        <div
            data-stack="v"
            data-gap="xs"
            data-test-id={actionBuilderTestIds.parameterRow}
            data-parameter-id={parameter.id}
        >
            <div
                className={styles['parameter-row']}
                data-stack="h"
                data-gap="sm"
                data-align="end"
            >
                <Field label="Подпись">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.parameterLabelInput}
                        bind={labelBind}
                        disabled={disabled}
                        placeholder="Сумма"
                    />
                </Field>
                <Field label="Тип">
                    <actionBuilderConfig.Select
                        data-test-id={actionBuilderTestIds.parameterTypeSelect}
                        bind={typeBind}
                        disabled={disabled}
                    >
                        <option value="string">Текст</option>
                        <option value="number">Число</option>
                        <option value="date">Дата</option>
                        <option value="bool">Да или нет</option>
                        <option value="day_of_week">День недели</option>
                    </actionBuilderConfig.Select>
                </Field>
                <div
                    className={styles['required-control']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-px="sm"
                >
                    <actionBuilderConfig.InputPropRenderer bind={requiredBind}>
                        {required => (
                            <label data-stack="h" data-gap="sm" data-align="center">
                                <Checkbox
                                    data-test-id={
                                        actionBuilderTestIds.parameterRequiredCheckbox
                                    }
                                    checked={required.value}
                                    disabled={disabled}
                                    onChange={event =>
                                        required.setValue(event.currentTarget.checked)
                                    }
                                />
                                Обязательное
                            </label>
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </div>
                <IconButton
                    className={styles['parameter-remove']}
                    data-test-id={actionBuilderTestIds.removeParameterButton}
                    aria-label="Удалить параметр"
                    disabled={disabled || parametersCount === 1}
                    variant="ghost"
                    onClick={handleRemoveParameter}
                >
                    <X size={20} />
                </IconButton>
            </div>
            <div
                className={styles['key-hint']}
                data-stack="h"
                data-gap="xs"
                data-align="center"
                data-px="xs"
            >
                <span>Код:</span>
                <actionBuilderConfig.Input
                    data-flex
                    data-test-id={actionBuilderTestIds.parameterKeyInput}
                    bind={keyBind}
                    disabled={disabled}
                    placeholder="автоматически"
                />
            </div>
        </div>
    );
};
