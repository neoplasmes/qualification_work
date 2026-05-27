import type { DatasetMetadata } from '@/entities/dataset';

import { FormField, Select, TextInput } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type { ActionEffectDraft, ActionParameterDraft } from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

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
}: EffectFieldsProps) => (
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
        {effect.kind === 'updateRowsByMatch' && (
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
        )}
    </>
);
