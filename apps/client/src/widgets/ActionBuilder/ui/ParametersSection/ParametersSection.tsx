import { Plus } from 'lucide-react';

import { Button, Card } from '@/shared/ui';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig, createBlankParameterDraft } from '../../model';
import { ParameterRow } from '../ParameterRow';

import styles from '../../ActionBuilder.module.scss';

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
        <Card className={styles['section-card']}>
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <h3 className={styles['section-title']}>Parameters</h3>
                    <p>Values the user enters before running the action.</p>
                </div>
                <Button
                    data-test-id={actionBuilderTestIds.addParameterButton}
                    disabled={disabled}
                    onClick={handleAddParameter}
                >
                    <Plus size={18} />
                    Add parameter
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
        </Card>
    );
};
