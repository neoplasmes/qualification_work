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
        className={styles['parameter-entry']}
        data-test-id={actionsTestIds.parameterRow}
        data-parameter-id={parameter.id}
    >
        <div className={styles['parameter-row']}>
            <FormField label="Label">
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
            <FormField label="Type">
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
            <Checkbox
                data-test-id={actionsTestIds.parameterRequiredCheckbox}
                label="Required"
                checked={parameter.required}
                disabled={disabled}
                onChange={event =>
                    onUpdateParameter(parameter.id, { required: event.target.checked })
                }
            />
            <IconButton
                data-test-id={actionsTestIds.removeParameterButton}
                aria-label="Remove parameter"
                disabled={disabled || parametersCount === 1}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        parameters: current.parameters.filter(
                            item => item.id !== parameter.id
                        ),
                    }))
                }
            >
                <X size={16} />
            </IconButton>
        </div>
        <div className={styles['key-hint']}>
            <span>key:</span>
            <TextInput
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
