import { FILTER_OP_LABELS, type FilterOperation } from '@/entities/chart';

import { Select, Switch, TextInput } from '@/shared/ui';

import { filterOperations } from '../../../const';
import type { ChartBuilderDerivedState, ChartBuilderState } from '../../../model';

import { AnalysisColumnOptions } from '../AnalysisColumnOptions';

import styles from '../../DatasetChartBuilder.module.scss';

const getFilterValuePlaceholder = (operation: FilterOperation) => {
    if (operation === 'between') {
        return 'min, max';
    }

    if (operation === 'in' || operation === 'nin') {
        return 'a, b, c';
    }

    return undefined;
};

type FilterSettingsSectionProps = {
    derived: ChartBuilderDerivedState;
    fields: ChartBuilderState;
};

export const FilterSettingsSection = ({
    derived,
    fields,
}: FilterSettingsSectionProps) => (
    <>
        <div
            className={styles['section']}
            data-stack="h"
            data-gap="sm"
            data-align="center"
        >
            <span>Filter</span>
            <Switch
                aria-label="Filter rows"
                checked={fields.filterEnabled}
                onChange={event => fields.setFilterEnabled(event.target.checked)}
            />
        </div>

        {fields.filterEnabled && (
            <>
                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Filter column</span>
                    <Select
                        value={derived.activeFilterColumn?.id ?? ''}
                        onChange={event => fields.setFilterColumnId(event.target.value)}
                    >
                        <AnalysisColumnOptions columns={derived.columns} />
                    </Select>
                </label>

                <label className={styles['control']} data-stack="v" data-gap="xs">
                    <span>Condition</span>
                    <Select
                        value={fields.filterOperation}
                        onChange={event =>
                            fields.setFilterOperation(
                                event.target.value as FilterOperation
                            )
                        }
                    >
                        {filterOperations.map(operation => (
                            <option key={operation} value={operation}>
                                {FILTER_OP_LABELS[operation]}
                            </option>
                        ))}
                    </Select>
                </label>

                {!derived.nullaryFilter && (
                    <label className={styles['control']} data-stack="v" data-gap="xs">
                        <span>Value</span>
                        <TextInput
                            value={fields.filterValue}
                            placeholder={getFilterValuePlaceholder(
                                fields.filterOperation
                            )}
                            onChange={event => fields.setFilterValue(event.target.value)}
                        />
                    </label>
                )}
            </>
        )}
    </>
);
