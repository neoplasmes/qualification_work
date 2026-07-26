import { Button, Text } from '@qualification-work/design-system';
import { Plus } from 'lucide-react';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig, createBlankParameterDraft } from '../../model';
import { ParameterRow } from '../ParameterRow';

import styles from '../../actionBuilder.module.css';

type ParametersSectionProps = {
    disabled: boolean;
};

export const ParametersSection = ({ disabled }: ParametersSectionProps) => {
    const snapshot = actionBuilderConfig.useConfig();
    const draft = snapshot.draft;

    const handleAddParameter = () => {
        snapshot.mutateDraft(nextDraft => {
            nextDraft.parameters.push(createBlankParameterDraft());
        });
    };

    return (
        <section className={styles['section-card']}>
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <Text
                        as="h3"
                        variant="heading-sm"
                        className={styles['section-title']}
                    >
                        Что спросить у сотрудника
                    </Text>
                    <p>Параметры, которые нужно заполнить перед запуском.</p>
                </div>
                <Button
                    data-test-id={actionBuilderTestIds.addParameterButton}
                    disabled={disabled}
                    onClick={handleAddParameter}
                >
                    <Plus size={18} />
                    Добавить параметр
                </Button>
            </div>

            {draft.parameters.map(parameter => (
                <ParameterRow
                    key={parameter.id}
                    parametersCount={draft.parameters.length}
                    parameter={parameter}
                    disabled={disabled}
                />
            ))}
        </section>
    );
};
