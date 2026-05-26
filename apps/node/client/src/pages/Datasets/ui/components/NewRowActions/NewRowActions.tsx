import { Check, X } from 'lucide-react';

import { IconButton } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './NewRowActions.module.scss';

type NewRowActionsProps = {
    valid: boolean;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export const NewRowActions = ({
    valid,
    loading,
    onConfirm,
    onCancel,
}: NewRowActionsProps) => (
    <div className={styles['new-row-actions']}>
        <IconButton
            data-test-id={datasetsTestIds.confirmInsertButton}
            aria-label="Confirm insert"
            disabled={!valid || loading}
            onClick={onConfirm}
        >
            <Check size={16} />
        </IconButton>
        <IconButton
            data-test-id={datasetsTestIds.cancelInsertButton}
            aria-label="Cancel insert"
            variant="danger"
            onClick={onCancel}
        >
            <X size={16} />
        </IconButton>
    </div>
);
