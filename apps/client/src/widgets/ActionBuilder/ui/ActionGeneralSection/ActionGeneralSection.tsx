import { FormField } from '@/shared/ui';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig } from '../../model';

type ActionGeneralSectionProps = {
    disabled: boolean;
};

export const ActionGeneralSection = ({ disabled }: ActionGeneralSectionProps) => (
    <FormField label="Name">
        <actionBuilderConfig.Input
            data-test-id={actionBuilderTestIds.actionNameInput}
            field="name"
            disabled={disabled}
            placeholder="Close invoice"
        />
    </FormField>
);
