import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import {
    IconButton,
    SegmentedControl,
    Select,
    TextInput,
    type SegmentedControlOption,
} from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type {
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

import styles from './EffectEditor.module.scss';

const mappingSourceOptions = [
    {
        value: 'parameter',
        label: 'param',
        testId: actionsTestIds.mappingSourceParameterButton,
    },
    {
        value: 'literal',
        label: 'literal',
        testId: actionsTestIds.mappingSourceLiteralButton,
    },
    {
        value: 'computed',
        label: 'computed',
        testId: actionsTestIds.mappingSourceComputedButton,
    },
] as const satisfies readonly SegmentedControlOption<
    ActionValueMappingDraft['sourceKind']
>[];

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
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
};

export const MappingRow = ({
    effect,
    mapping,
    columns,
    parameters,
    disabled,
    onUpdateEffect,
    onUpdateMapping,
}: MappingRowProps) => {
    const showUpdateOperation =
        effect.kind === 'updateRowsByMatch' && mapping.sourceKind !== 'computed';

    let valueControls;
    if (mapping.sourceKind === 'computed') {
        valueControls = (
            <>
                <ParameterSelect
                    testId={actionsTestIds.mappingComputedLeftParameterSelect}
                    parameters={parameters}
                    value={mapping.leftParameterKey}
                    disabled={disabled}
                    onChange={value =>
                        onUpdateMapping(effect.id, mapping.id, {
                            leftParameterKey: value,
                        })
                    }
                />
                <Select
                    className={styles['operation-select']}
                    data-test-id={actionsTestIds.mappingComputedOperationSelect}
                    value={mapping.computedOperation}
                    disabled={disabled}
                    onChange={event =>
                        onUpdateMapping(effect.id, mapping.id, {
                            computedOperation: event.target
                                .value as ActionValueMappingDraft['computedOperation'],
                        })
                    }
                >
                    {computedOperationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
                <ParameterSelect
                    testId={actionsTestIds.mappingComputedRightParameterSelect}
                    parameters={parameters}
                    value={mapping.rightParameterKey}
                    disabled={disabled}
                    onChange={value =>
                        onUpdateMapping(effect.id, mapping.id, {
                            rightParameterKey: value,
                        })
                    }
                />
            </>
        );
    } else {
        valueControls = (
            <>
                {showUpdateOperation ? (
                    <Select
                        className={styles['operation-select']}
                        data-test-id={actionsTestIds.mappingOperationSelect}
                        value={mapping.operation}
                        disabled={disabled}
                        onChange={event =>
                            onUpdateMapping(effect.id, mapping.id, {
                                operation: event.target
                                    .value as ActionValueMappingDraft['operation'],
                            })
                        }
                    >
                        {valueOperationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                ) : null}
                {mapping.sourceKind === 'parameter' ? (
                    <ParameterSelect
                        testId={actionsTestIds.mappingParameterSelect}
                        parameters={parameters}
                        value={mapping.parameterKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateMapping(effect.id, mapping.id, {
                                parameterKey: value,
                            })
                        }
                    />
                ) : (
                    <TextInput
                        data-test-id={actionsTestIds.mappingLiteralInput}
                        value={mapping.literalValue}
                        disabled={disabled}
                        placeholder="Paid"
                        onChange={event =>
                            onUpdateMapping(effect.id, mapping.id, {
                                literalValue: event.target.value,
                            })
                        }
                    />
                )}
            </>
        );
    }

    return (
        <div
            className={styles['mapping-row']}
            data-display="grid"
            data-gap="sm"
            data-align="end"
            data-test-id={actionsTestIds.mappingRow}
            data-mapping-id={mapping.id}
        >
            <div data-stack="v" data-gap="xs">
                <div
                    className={styles['mapping-header']}
                    data-stack="h"
                    data-gap="sm"
                    data-align="center"
                >
                    <span className={styles['control-label']}>Column</span>
                    <SegmentedControl
                        value={mapping.sourceKind}
                        options={mappingSourceOptions}
                        ariaLabel="Value source"
                        className={styles['source-toggle']}
                        disabled={disabled}
                        onChange={sourceKind =>
                            onUpdateMapping(effect.id, mapping.id, { sourceKind })
                        }
                    />
                </div>
                <div className={styles['mapping-controls']}>
                    <ColumnSelect
                        testId={actionsTestIds.mappingColumnSelect}
                        columns={columns}
                        value={mapping.columnKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateMapping(effect.id, mapping.id, { columnKey: value })
                        }
                    />
                    {valueControls}
                </div>
            </div>
            <IconButton
                tone="nav"
                data-test-id={actionsTestIds.removeValueButton}
                aria-label="Remove value"
                disabled={disabled || effect.values.length === 1}
                onClick={() =>
                    onUpdateEffect(effect.id, {
                        values: effect.values.filter(item => item.id !== mapping.id),
                    })
                }
            >
                <X size={20} />
            </IconButton>
        </div>
    );
};
