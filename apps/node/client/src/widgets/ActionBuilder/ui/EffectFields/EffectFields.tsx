import type { DatasetMetadata } from '@/entities/dataset';

import { FormField, SegmentedControl, type SegmentedControlOption } from '@/shared/ui';

import { actionBuilderTestIds } from '../../const';
import {
    actionBuilderConfig,
    createEffectFieldBind,
    type ActionEffectDraft,
    type ActionParameterDraft,
} from '../../model';
import { ColumnSelect } from '../ColumnSelect';
import { ParameterSelect } from '../ParameterSelect';

const matchSourceOptions = [
    {
        value: 'parameter',
        label: 'param',
        testId: actionBuilderTestIds.effectMatchSourceParameterButton,
    },
    {
        value: 'literal',
        label: 'literal',
        testId: actionBuilderTestIds.effectMatchSourceLiteralButton,
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
};

export const EffectFields = ({
    effect,
    parameters,
    columns,
    datasets,
    disabled,
}: EffectFieldsProps) => {
    const kindBind = createEffectFieldBind(effect.id, 'kind');
    const datasetBind = createEffectFieldBind(effect.id, 'datasetId');
    const matchColumnBind = createEffectFieldBind(effect.id, 'matchColumnKey');
    const matchSourceBind = createEffectFieldBind(effect.id, 'matchSourceKind');
    const matchParameterBind = createEffectFieldBind(effect.id, 'matchParameterKey');
    const matchLiteralBind = createEffectFieldBind(effect.id, 'matchLiteralValue');
    const maxRowsBind = createEffectFieldBind(effect.id, 'maxRows');

    let updateFields;

    if (effect.kind === 'updateRowsByMatch') {
        let matchValueField;

        if (effect.matchSourceKind === 'parameter') {
            matchValueField = (
                <FormField label="Match parameter">
                    <actionBuilderConfig.InputPropRenderer bind={matchParameterBind}>
                        {matchParameter => (
                            <ParameterSelect
                                testId={actionBuilderTestIds.effectMatchParameterSelect}
                                parameters={parameters}
                                value={matchParameter.value}
                                disabled={disabled}
                                onChange={matchParameter.setValue}
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </FormField>
            );
        } else {
            matchValueField = (
                <FormField label="Match literal">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.effectMatchLiteralInput}
                        bind={matchLiteralBind}
                        disabled={disabled}
                        placeholder="MF-001"
                    />
                </FormField>
            );
        }

        updateFields = (
            <>
                <FormField label="Match column">
                    <actionBuilderConfig.InputPropRenderer bind={matchColumnBind}>
                        {matchColumn => (
                            <ColumnSelect
                                testId={actionBuilderTestIds.effectMatchColumnSelect}
                                columns={columns}
                                value={matchColumn.value}
                                disabled={disabled}
                                onChange={matchColumn.setValue}
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </FormField>
                <FormField label="Match source">
                    <actionBuilderConfig.InputPropRenderer bind={matchSourceBind}>
                        {matchSource => (
                            <SegmentedControl
                                value={matchSource.value}
                                options={matchSourceOptions}
                                ariaLabel="Match source"
                                disabled={disabled}
                                onChange={matchSource.setValue}
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </FormField>
                {matchValueField}
                <FormField label="Max rows">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.effectMaxRowsInput}
                        bind={maxRowsBind}
                        type="number"
                        min={1}
                        disabled={disabled}
                    />
                </FormField>
            </>
        );
    }

    return (
        <>
            <FormField label="Type">
                <actionBuilderConfig.Select
                    data-test-id={actionBuilderTestIds.effectTypeSelect}
                    bind={kindBind}
                    disabled={disabled}
                >
                    <option value="insertRow">Insert row</option>
                    <option value="updateRowsByMatch">Update rows by match</option>
                </actionBuilderConfig.Select>
            </FormField>
            <FormField label="Dataset">
                <actionBuilderConfig.Select
                    data-test-id={actionBuilderTestIds.effectDatasetSelect}
                    bind={datasetBind}
                    disabled={disabled}
                >
                    <option value="">Select dataset</option>
                    {datasets.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </actionBuilderConfig.Select>
            </FormField>
            {updateFields}
        </>
    );
};
