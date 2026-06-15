import type { Config, ConfigBind, ConfigFieldKey } from '@/features/Config';

import type { DatasetColumn } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import styles from './BreakdownSettingsSection.module.scss';

type BreakdownSettingsSectionProps<T extends object> = {
    config: Config<T>;
    enabledField: ConfigFieldKey<T, boolean>;
    columnBind: ConfigBind<T, string>;
    topNBind: ConfigBind<T, string>;
    otherBucketBind?: ConfigBind<T, 'on' | 'off'>;
    columns: DatasetColumn[];
    showOtherBucket: boolean;
};

export const BreakdownSettingsSection = <T extends object>({
    config,
    enabledField,
    columnBind,
    topNBind,
    otherBucketBind,
    columns,
    showOtherBucket,
}: BreakdownSettingsSectionProps<T>) => {
    return (
        <config.Section
            name="Breakdown"
            enabledField={enabledField}
            className={styles['section']}
        >
            <FormField label="Split by">
                <config.Select bind={columnBind}>
                    {columns.map(column => (
                        <option
                            key={column.id}
                            value={column.id}
                            disabled={column.isAnalyzable === false}
                        >
                            {column.displayName}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            <FormField label="Max categories">
                <config.Input bind={topNBind} type="number" min={1} max={50} />
            </FormField>

            {showOtherBucket && otherBucketBind && (
                <FormField label="Group others">
                    <config.Select bind={otherBucketBind}>
                        <option value="on">On</option>
                        <option value="off">Off</option>
                    </config.Select>
                </FormField>
            )}
        </config.Section>
    );
};
