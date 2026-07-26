import { Choice, IconButton } from '@qualification-work/design-system';
import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { actionBuilderTestIds } from '../../const';
import {
    actionBuilderConfig,
    createMappingFieldBind,
    type ActionEffectDraft,
    type ActionParameterDraft,
    type ActionValueMappingDraft,
} from '../../model';
import { ColumnSelect } from '../ColumnSelect';
import { ParameterSelect } from '../ParameterSelect';

import styles from './mappingRow.module.css';

const mappingSourceOptions = [
    {
        value: 'parameter',
        label: (
            <span data-test-id={actionBuilderTestIds.mappingSourceParameterButton}>
                param
            </span>
        ),
    },
    {
        value: 'literal',
        label: (
            <span data-test-id={actionBuilderTestIds.mappingSourceLiteralButton}>
                literal
            </span>
        ),
    },
    {
        value: 'computed',
        label: (
            <span data-test-id={actionBuilderTestIds.mappingSourceComputedButton}>
                computed
            </span>
        ),
    },
] as const;

const valueOperationOptions = [
    { value: '=', label: '=' },
    { value: '+', label: '+' },
    { value: '-', label: '−' },
    { value: '*', label: '×' },
    { value: '/', label: '/' },
] as const;

const computedOperationOptions = valueOperationOptions.filter(
    option => option.value !== '='
);

type MappingRowProps = {
    effect: ActionEffectDraft;
    mapping: ActionValueMappingDraft;
    columns: DatasetMetadata['columns'];
    parameters: ActionParameterDraft[];
    disabled: boolean;
};

export const MappingRow = ({
    effect,
    mapping,
    columns,
    parameters,
    disabled,
}: MappingRowProps) => {
    const snapshot = actionBuilderConfig.useConfig();

    const sourceKindBind = createMappingFieldBind(effect.id, mapping.id, 'sourceKind');
    const columnKeyBind = createMappingFieldBind(effect.id, mapping.id, 'columnKey');
    const parameterKeyBind = createMappingFieldBind(
        effect.id,
        mapping.id,
        'parameterKey'
    );
    const literalValueBind = createMappingFieldBind(
        effect.id,
        mapping.id,
        'literalValue'
    );
    const operationBind = createMappingFieldBind(effect.id, mapping.id, 'operation');
    const leftParameterKeyBind = createMappingFieldBind(
        effect.id,
        mapping.id,
        'leftParameterKey'
    );
    const computedOperationBind = createMappingFieldBind(
        effect.id,
        mapping.id,
        'computedOperation'
    );
    const rightParameterKeyBind = createMappingFieldBind(
        effect.id,
        mapping.id,
        'rightParameterKey'
    );

    const showUpdateOperation =
        effect.kind === 'updateRowsByMatch' && mapping.sourceKind !== 'computed';

    const handleRemoveValue = () => {
        snapshot.mutateDraft(draft => {
            const nextEffect = draft.effects.find(item => item.id === effect.id);

            if (nextEffect) {
                nextEffect.values = nextEffect.values.filter(
                    item => item.id !== mapping.id
                );
            }
        });
    };

    let valueControls;

    if (mapping.sourceKind === 'computed') {
        valueControls = (
            <>
                <actionBuilderConfig.InputPropRenderer bind={leftParameterKeyBind}>
                    {leftParameter => (
                        <ParameterSelect
                            testId={
                                actionBuilderTestIds.mappingComputedLeftParameterSelect
                            }
                            parameters={parameters}
                            value={leftParameter.value}
                            disabled={disabled}
                            onChange={leftParameter.setValue}
                        />
                    )}
                </actionBuilderConfig.InputPropRenderer>
                <actionBuilderConfig.Select
                    className={styles['operation-select']}
                    data-test-id={actionBuilderTestIds.mappingComputedOperationSelect}
                    bind={computedOperationBind}
                    disabled={disabled}
                >
                    {computedOperationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </actionBuilderConfig.Select>
                <actionBuilderConfig.InputPropRenderer bind={rightParameterKeyBind}>
                    {rightParameter => (
                        <ParameterSelect
                            testId={
                                actionBuilderTestIds.mappingComputedRightParameterSelect
                            }
                            parameters={parameters}
                            value={rightParameter.value}
                            disabled={disabled}
                            onChange={rightParameter.setValue}
                        />
                    )}
                </actionBuilderConfig.InputPropRenderer>
            </>
        );
    } else {
        valueControls = (
            <>
                {showUpdateOperation ? (
                    <actionBuilderConfig.Select
                        className={styles['operation-select']}
                        data-test-id={actionBuilderTestIds.mappingOperationSelect}
                        bind={operationBind}
                        disabled={disabled}
                    >
                        {valueOperationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </actionBuilderConfig.Select>
                ) : null}
                {mapping.sourceKind === 'parameter' ? (
                    <actionBuilderConfig.InputPropRenderer bind={parameterKeyBind}>
                        {parameter => (
                            <ParameterSelect
                                testId={actionBuilderTestIds.mappingParameterSelect}
                                parameters={parameters}
                                value={parameter.value}
                                disabled={disabled}
                                onChange={parameter.setValue}
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                ) : (
                    <actionBuilderConfig.Input
                        data-test-id={actionBuilderTestIds.mappingLiteralInput}
                        bind={literalValueBind}
                        disabled={disabled}
                        placeholder="Paid"
                    />
                )}
            </>
        );
    }

    return (
        <div
            className={styles['mapping-row']}
            data-stack="v"
            data-gap="sm"
            data-align="end"
            data-test-id={actionBuilderTestIds.mappingRow}
            data-mapping-id={mapping.id}
        >
            <div data-stack="v" data-gap="xs">
                <div
                    className={styles['mapping-header']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    <span className={styles['control-label']}>Поле</span>
                    <actionBuilderConfig.InputPropRenderer bind={sourceKindBind}>
                        {sourceKind => (
                            <Choice
                                value={sourceKind.value}
                                options={mappingSourceOptions}
                                aria-label="Источник значения"
                                className={styles['source-toggle']}
                                disabled={disabled}
                                onValueChange={value =>
                                    sourceKind.setValue(
                                        value as ActionValueMappingDraft['sourceKind']
                                    )
                                }
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                </div>
                <div className={styles['mapping-controls']}>
                    <actionBuilderConfig.InputPropRenderer bind={columnKeyBind}>
                        {columnKey => (
                            <ColumnSelect
                                testId={actionBuilderTestIds.mappingColumnSelect}
                                columns={columns}
                                value={columnKey.value}
                                disabled={disabled}
                                onChange={columnKey.setValue}
                            />
                        )}
                    </actionBuilderConfig.InputPropRenderer>
                    {valueControls}
                </div>
            </div>
            <IconButton
                variant="ghost"
                data-test-id={actionBuilderTestIds.removeValueButton}
                aria-label="Удалить значение"
                disabled={disabled || effect.values.length === 1}
                onClick={handleRemoveValue}
            >
                <X size={20} />
            </IconButton>
        </div>
    );
};
