import { CircleQuestionMark } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { Tooltip } from '../Tooltip';

import styles from './Explain.module.scss';

type ExplainProps = {
    description: ReactNode;
    label?: string;
    className?: string;
};

export const Explain = ({
    description,
    label = 'Show explanation',
    className,
}: ExplainProps) => {
    const tooltipId = useId();

    return (
        <span className={[styles['root'], className ?? ''].filter(Boolean).join(' ')}>
            <span
                className={styles['trigger']}
                tabIndex={0}
                aria-label={label}
                aria-describedby={tooltipId}
            >
                <CircleQuestionMark size={16} aria-hidden />
            </span>
            <Tooltip id={tooltipId} className={styles['tooltip']}>
                {description}
            </Tooltip>
        </span>
    );
};
