import type { DatasetMetadata } from '@/entities/dataset';

import {
    FormField,
    SegmentedControl,
    Select,
    TextInput,
    type SegmentedControlOption,
} from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionEffectDraft, ActionParameterDraft } from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

const matchSourceOptions = [
    {
        value: 'parameter',
        label: 'param',
        testId: actionsTestIds.effectMatchSourceParameterButton,
    },
    {
        value: 'literal',
        label: 'literal',
        testId: actionsTestIds.effectMatchSourceLiteralButton,
    },
] as const satisfies readonly SegmentedControlOption<
    ActionEffectDraft['matchSourceKind']
>[];

type EffectFieldsProps = {
    effect: ActionEffectDraft;
    parameters: ActionParameterDraft[];
    columns: DatasetMetadata['columns'];
    datasets: DatasetMetadata[];
    disabled: boolean;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
};

export const EffectFields = ({
    effect,
    parameters,
    columns,
    datasets,
    disabled,
    onUpdateEffect,
}: EffectFieldsProps) => {
    let updateFields;
    if (effect.kind === 'updateRowsByMatch') {
        let matchValueField;
        if (effect.matchSourceKind === 'parameter') {
            matchValueField = (
                <FormField label="Match parameter">
                    <ParameterSelect
                        testId={actionsTestIds.effectMatchParameterSelect}
                        parameters={parameters}
                        value={effect.matchParameterKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateEffect(effect.id, { matchParameterKey: value })
                        }
                    />
                </FormField>
            );
        } else {
            matchValueField = (
                <FormField label="Match literal">
                    <TextInput
                        data-test-id={actionsTestIds.effectMatchLiteralInput}
                        value={effect.matchLiteralValue}
                        disabled={disabled}
                        placeholder="MF-001"
                        onChange={event =>
                            onUpdateEffect(effect.id, {
                                matchLiteralValue: event.target.value,
                            })
                        }
                    />
                </FormField>
            );
        }

        updateFields = (
            <>
                <FormField label="Match column">
                    <ColumnSelect
                        testId={actionsTestIds.effectMatchColumnSelect}
                        columns={columns}
                        value={effect.matchColumnKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateEffect(effect.id, { matchColumnKey: value })
                        }
                    />
                </FormField>
                <FormField label="Match source">
                    <SegmentedControl
                        value={effect.matchSourceKind}
                        options={matchSourceOptions}
                        ariaLabel="Match source"
                        disabled={disabled}
                        onChange={matchSourceKind =>
                            onUpdateEffect(effect.id, { matchSourceKind })
                        }
                    />
                </FormField>
                {matchValueField}
                <FormField label="Max rows">
                    <TextInput
                        data-test-id={actionsTestIds.effectMaxRowsInput}
                        type="number"
                        min={1}
                        value={effect.maxRows}
                        disabled={disabled}
                        onChange={event =>
                            onUpdateEffect(effect.id, { maxRows: event.target.value })
                        }
                    />
                </FormField>
            </>
        );
    }

    return (
        <>
            <FormField label="Type">
                <Select
                    data-test-id={actionsTestIds.effectTypeSelect}
                    value={effect.kind}
                    disabled={disabled}
                    onChange={event =>
                        onUpdateEffect(effect.id, {
                            kind: event.target.value as ActionEffectDraft['kind'],
                        })
                    }
                >
                    <option value="insertRow">Insert row</option>
                    <option value="updateRowsByMatch">Update rows by match</option>
                </Select>
            </FormField>
            <FormField label="Dataset">
                <Select
                    data-test-id={actionsTestIds.effectDatasetSelect}
                    value={effect.datasetId}
                    disabled={disabled}
                    onChange={event =>
                        onUpdateEffect(effect.id, { datasetId: event.target.value })
                    }
                >
                    <option value="">Select dataset</option>
                    {datasets.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            {updateFields}
        </>
    );
};
