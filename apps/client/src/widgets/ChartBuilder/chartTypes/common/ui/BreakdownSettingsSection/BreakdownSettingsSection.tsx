import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { Field } from '@qualification-work/design-system';

import type { Config, ConfigBind, ConfigFieldKey } from '@/shared/ui/tools/Config';

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
        <config.Section name="Breakdown" enabledField={enabledField}>
            <Field label="Split by">
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
            </Field>

            <Field label="Max categories">
                <config.Input bind={topNBind} type="number" min={1} max={50} />
            </Field>

            {showOtherBucket && otherBucketBind && (
                <Field label="Group others">
                    <config.Select bind={otherBucketBind}>
                        <option value="on">On</option>
                        <option value="off">Off</option>
                    </config.Select>
                </Field>
            )}
        </config.Section>
    );
};
