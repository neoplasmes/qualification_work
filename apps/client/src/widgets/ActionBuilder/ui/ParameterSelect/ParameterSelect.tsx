import { Select } from '@qualification-work/design-system';

import type { ActionParameterDraft } from '../../model';

type ParameterSelectProps = {
    parameters: ActionParameterDraft[];
    value: string;
    disabled: boolean;
    testId: string;
    onChange: (value: string) => void;
};

export const ParameterSelect = ({
    parameters,
    value,
    disabled,
    testId,
    onChange,
}: ParameterSelectProps) => (
    <Select
        data-test-id={testId}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
    >
        <option value="">Select parameter</option>
        {parameters
            .filter(parameter => parameter.key.trim())
            .map(parameter => (
                <option key={parameter.id} value={parameter.key.trim()}>
                    {parameter.label.trim() || parameter.key.trim()}
                </option>
            ))}
    </Select>
);
