import { X } from 'lucide-react';

import { Checkbox, FormField, IconButton } from '@/shared/ui';

import { actionBuilderTestIds } from '../../const';
import {
    actionBuilderConfig,
    createParameterFieldBind,
    type ActionParameterDraft,
} from '../../model';

import styles from './ParameterRow.module.scss';

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
            data-display="grid"
            data-gap="xs"
            data-test-id={actionBuilderTestIds.parameterRow}
            data-parameter-id={parameter.id}
        >
            <div
                className={styles['parameter-row']}
                data-display="grid"
                data-gap="sm"
                data-align="end"
            >
                <FormField label="Label">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.parameterLabelInput}
                        bind={labelBind}
                        disabled={disabled}
                        placeholder="Amount"
                    />
                </FormField>
                <FormField label="Type">
                    <actionBuilderConfig.Select
                        data-test-id={actionBuilderTestIds.parameterTypeSelect}
                        bind={typeBind}
                        disabled={disabled}
                    >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="bool">Bool</option>
                        <option value="day_of_week">Day of week</option>
                    </actionBuilderConfig.Select>
                </FormField>
                <div
                    className={styles['required-control']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-px="sm"
                >
                    <actionBuilderConfig.InputPropRenderer bind={requiredBind}>
                        {required => (
                            <Checkbox
                                data-test-id={
                                    actionBuilderTestIds.parameterRequiredCheckbox
                                }
                                label="Required"
                                checked={required.value}
                                disabled={disabled}
                                onChange={event =>
                                    required.setValue(event.currentTarget.checked)
                                }
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </div>
                <IconButton
                    className={styles['parameter-remove']}
                    data-test-id={actionBuilderTestIds.removeParameterButton}
                    aria-label="Remove parameter"
                    disabled={disabled || parametersCount === 1}
                    tone="nav"
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
                <span>key:</span>
                <actionBuilderConfig.Input
                    data-flex
                    data-test-id={actionBuilderTestIds.parameterKeyInput}
                    bind={keyBind}
                    disabled={disabled}
                    placeholder="auto"
                />
            </div>
        </div>
    );
};
