import { Field } from '@qualification-work/design-system';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig } from '../../model';

type ActionGeneralSectionProps = {
    disabled: boolean;
};

export const ActionGeneralSection = ({ disabled }: ActionGeneralSectionProps) => (
    <Field label="Название">
        <actionBuilderConfig.Input
            data-test-id={actionBuilderTestIds.actionNameInput}
            field="name"
            disabled={disabled}
            placeholder="Закрыть счёт"
        />
    </Field>
);
