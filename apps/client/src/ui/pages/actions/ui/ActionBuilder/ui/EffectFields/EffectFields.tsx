import { Choice, Field } from '@qualification-work/design-system';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

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
        label: (
            <span data-test-id={actionBuilderTestIds.effectMatchSourceParameterButton}>
                param
            </span>
        ),
    },
    {
        value: 'literal',
        label: (
            <span data-test-id={actionBuilderTestIds.effectMatchSourceLiteralButton}>
                literal
            </span>
        ),
    },
] as const;

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
                <Field label="Параметр условия">
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
                </Field>
            );
        } else {
            matchValueField = (
                <Field label="Значение условия">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.effectMatchLiteralInput}
                        bind={matchLiteralBind}
                        disabled={disabled}
                        placeholder="MF-001"
                    />
                </Field>
            );
        }

        updateFields = (
            <>
                <Field label="Поле условия">
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
                </Field>
                <Field label="Источник условия">
                    <actionBuilderConfig.InputPropRenderer bind={matchSourceBind}>
                        {matchSource => (
                            <Choice
                                value={matchSource.value}
                                options={matchSourceOptions}
                                aria-label="Источник условия"
                                disabled={disabled}
                                onValueChange={value =>
                                    matchSource.setValue(
                                        value as ActionEffectDraft['matchSourceKind']
                                    )
                                }
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </Field>
                {matchValueField}
                <Field label="Не более строк">
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.effectMaxRowsInput}
                        bind={maxRowsBind}
                        type="number"
                        min={1}
                        disabled={disabled}
                    />
                </Field>
            </>
        );
    }

    return (
        <>
            <Field label="Тип">
                <actionBuilderConfig.Select
                    data-test-id={actionBuilderTestIds.effectTypeSelect}
                    bind={kindBind}
                    disabled={disabled}
                >
                    <option value="insertRow">Добавить строку</option>
                    <option value="updateRowsByMatch">Изменить строки по условию</option>
                </actionBuilderConfig.Select>
            </Field>
            <Field label="Таблица">
                <actionBuilderConfig.Select
                    data-test-id={actionBuilderTestIds.effectDatasetSelect}
                    bind={datasetBind}
                    disabled={disabled}
                >
                    <option value="">Выберите таблицу</option>
                    {datasets.map(item => (
                        <option key={item.dataset.id} value={item.dataset.id}>
                            {item.dataset.name}
                        </option>
                    ))}
                </actionBuilderConfig.Select>
            </Field>
            {updateFields}
        </>
    );
};
