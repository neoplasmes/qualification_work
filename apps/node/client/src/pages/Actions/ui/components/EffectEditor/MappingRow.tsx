import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { IconButton } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type {
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

import styles from './EffectEditor.module.scss';

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
}: MappingRowProps) => (
    <div
        className={styles['mapping-row']}
        data-test-id={actionsTestIds.mappingRow}
        data-mapping-id={mapping.id}
    >
        <label className={styles['control']}>
            <span>Column</span>
            <ColumnSelect
                testId={actionsTestIds.mappingColumnSelect}
                columns={columns}
                value={mapping.columnKey}
                disabled={disabled}
                onChange={value =>
                    onUpdateMapping(effect.id, mapping.id, { columnKey: value })
                }
            />
        </label>
        <div className={styles['control']}>
            <div className={styles['value-header']}>
                <span>Value</span>
                <div className={styles['source-toggle']}>
                    <button
                        type="button"
                        data-test-id={actionsTestIds.mappingSourceParameterButton}
                        disabled={disabled}
                        className={`${styles['source-btn']} ${
                            mapping.sourceKind === 'parameter' ? styles['active'] : ''
                        }`}
                        onClick={() =>
                            onUpdateMapping(effect.id, mapping.id, {
                                sourceKind: 'parameter',
                            })
                        }
                    >
                        param
                    </button>
                    <button
                        type="button"
                        data-test-id={actionsTestIds.mappingSourceLiteralButton}
                        disabled={disabled}
                        className={`${styles['source-btn']} ${
                            mapping.sourceKind === 'literal' ? styles['active'] : ''
                        }`}
                        onClick={() =>
                            onUpdateMapping(effect.id, mapping.id, {
                                sourceKind: 'literal',
                            })
                        }
                    >
                        literal
                    </button>
                </div>
            </div>
            {mapping.sourceKind === 'parameter' ? (
                <ParameterSelect
                    testId={actionsTestIds.mappingParameterSelect}
                    parameters={parameters}
                    value={mapping.parameterKey}
                    disabled={disabled}
                    onChange={value =>
                        onUpdateMapping(effect.id, mapping.id, { parameterKey: value })
                    }
                />
            ) : (
                <input
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
        </div>
        <IconButton
            data-test-id={actionsTestIds.removeValueButton}
            aria-label="Remove value"
            disabled={disabled || effect.values.length === 1}
            onClick={() =>
                onUpdateEffect(effect.id, {
                    values: effect.values.filter(item => item.id !== mapping.id),
                })
            }
        >
            <X size={16} />
        </IconButton>
    </div>
);
