import { X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Checkbox, FormField, IconButton, Select, TextInput } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionDraft, ActionParameterDraft } from '../../../model';

import styles from './ConfigureForm.module.scss';

type ParameterRowProps = {
    parametersCount: number;
    parameter: ActionParameterDraft;
    disabled: boolean;
    onDraftChange: Dispatch<SetStateAction<ActionDraft>>;
    onUpdateParameter: (
        parameterId: string,
        patch: Partial<ActionParameterDraft>
    ) => void;
};

export const ParameterRow = ({
    parametersCount,
    parameter,
    disabled,
    onDraftChange,
    onUpdateParameter,
}: ParameterRowProps) => (
    <div
        data-display="grid"
        data-gap="xs"
        data-test-id={actionsTestIds.parameterRow}
        data-parameter-id={parameter.id}
    >
        <div
            className={styles['parameter-row']}
            data-display="grid"
            data-gap="sm"
            data-align="end"
        >
            <FormField className={styles['parameter-label']} label="Label">
                <TextInput
                    data-test-id={actionsTestIds.parameterLabelInput}
                    value={parameter.label}
                    disabled={disabled}
                    placeholder="Amount"
                    onChange={event =>
                        onUpdateParameter(parameter.id, { label: event.target.value })
                    }
                />
            </FormField>
            <FormField className={styles['parameter-type']} label="Type">
                <Select
                    data-test-id={actionsTestIds.parameterTypeSelect}
                    value={parameter.type}
                    disabled={disabled}
                    onChange={event =>
                        onUpdateParameter(parameter.id, {
                            type: event.target.value as ActionParameterDraft['type'],
                        })
                    }
                >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="bool">Bool</option>
                    <option value="day_of_week">Day of week</option>
                </Select>
            </FormField>
            <div
                className={styles['required-control']}
                data-stack="h"
                data-align="center"
                data-justify="center"
                data-px="sm"
            >
                <Checkbox
                    data-test-id={actionsTestIds.parameterRequiredCheckbox}
                    label="Required"
                    checked={parameter.required}
                    disabled={disabled}
                    onChange={event =>
                        onUpdateParameter(parameter.id, {
                            required: event.target.checked,
                        })
                    }
                />
            </div>
            <IconButton
                className={styles['parameter-remove']}
                data-test-id={actionsTestIds.removeParameterButton}
                aria-label="Remove parameter"
                disabled={disabled || parametersCount === 1}
                tone="transparent"
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        parameters: current.parameters.filter(
                            item => item.id !== parameter.id
                        ),
                    }))
                }
            >
                <X />
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
            <TextInput
                data-flex
                data-test-id={actionsTestIds.parameterKeyInput}
                value={parameter.key}
                disabled={disabled}
                placeholder="auto"
                onChange={event =>
                    onUpdateParameter(parameter.id, { key: event.target.value })
                }
            />
        </div>
    </div>
);
