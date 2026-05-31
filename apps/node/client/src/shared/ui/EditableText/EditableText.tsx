import { Check, PencilLine, X } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
} from 'react';

import { IconButton } from '../Button';
import { TextInput } from '../TextInput';
import { Tooltip } from '../Tooltip';

import styles from './EditableText.module.scss';

const tooltipGap = 8;
const tooltipMargin = 8;
const tooltipMaxWidth = 260;

type EditableTextProps = {
    title: string;
    fallbackTitle: string;
    saving?: boolean;
    editButtonTestId?: string;
    inputTestId?: string;
    onRename: (name: string) => Promise<void> | void;
};

export const EditableText = ({
    title,
    fallbackTitle,
    saving = false,
    editButtonTestId,
    inputTestId,
    onRename,
}: EditableTextProps) => {
    const displayTitle = title.trim() || fallbackTitle;
    const titleRef = useRef<HTMLHeadingElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const tooltipFrameRef = useRef<number | null>(null);
    const tooltipId = useId();
    const [committedTitle, setCommittedTitle] = useState(displayTitle);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(displayTitle);
    const [error, setError] = useState('');
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const shownTitle = committedTitle.trim() || fallbackTitle;

    useEffect(() => {
        setCommittedTitle(displayTitle);
        setDraft(displayTitle);
    }, [displayTitle]);

    const cancel = () => {
        setEditing(false);
        setDraft(shownTitle);
        setError('');
    };

    const commit = async () => {
        const nextName = draft.trim();

        if (!nextName) {
            setError('Name can not be empty.');

            return;
        }

        if (nextName === shownTitle) {
            cancel();

            return;
        }

        try {
            setError('');
            await onRename(nextName);
            setCommittedTitle(nextName);
            setEditing(false);
        } catch (renameError) {
            setError(
                renameError instanceof Error
                    ? renameError.message
                    : 'Unable to rename this item.'
            );
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void commit();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
        }
    };

    const canShowTooltip = () => {
        const titleElement = titleRef.current;

        return Boolean(
            titleElement &&
            shownTitle &&
            titleElement.scrollWidth > titleElement.clientWidth
        );
    };

    const updateTooltipPosition = (clientX: number, clientY: number) => {
        const left = Math.max(
            tooltipMargin,
            Math.min(
                clientX + tooltipGap,
                window.innerWidth - tooltipMaxWidth - tooltipMargin
            )
        );
        const top = Math.max(tooltipMargin, clientY + tooltipGap);
        const transform = `translateX(${left}px) translateY(${top}px)`;

        if (tooltipFrameRef.current !== null) {
            window.cancelAnimationFrame(tooltipFrameRef.current);
        }

        tooltipFrameRef.current = window.requestAnimationFrame(() => {
            tooltipFrameRef.current = null;
            tooltipRef.current?.style.setProperty('transform', transform);
        });
    };

    const showTooltip = () => {
        if (!canShowTooltip()) {
            setIsTooltipOpen(false);

            return;
        }

        setIsTooltipOpen(true);
    };

    const showTooltipAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!canShowTooltip()) {
            setIsTooltipOpen(false);

            return;
        }

        updateTooltipPosition(event.clientX, event.clientY);
        setIsTooltipOpen(true);
    };

    const moveTooltip = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (isTooltipOpen) {
            updateTooltipPosition(event.clientX, event.clientY);
        }
    };

    const hideTooltip = () => {
        if (tooltipFrameRef.current !== null) {
            window.cancelAnimationFrame(tooltipFrameRef.current);
            tooltipFrameRef.current = null;
        }

        setIsTooltipOpen(false);
    };

    let titleContent: ReactNode;
    if (editing) {
        titleContent = (
            <div data-stack="h" data-gap="xs" data-align="center">
                <TextInput
                    autoFocus
                    className={styles['title-input']}
                    data-test-id={inputTestId}
                    value={draft}
                    invalid={!!error}
                    disabled={saving}
                    onBlur={() => void commit()}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <IconButton
                    data-p="xs"
                    aria-label="Save name"
                    disabled={saving}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => void commit()}
                >
                    <Check size={16} />
                </IconButton>
                <IconButton
                    data-p="xs"
                    aria-label="Cancel rename"
                    disabled={saving}
                    onMouseDown={event => event.preventDefault()}
                    onClick={cancel}
                >
                    <X size={16} />
                </IconButton>
            </div>
        );
    } else {
        titleContent = (
            <div
                className={styles['title-row']}
                aria-describedby={isTooltipOpen ? tooltipId : undefined}
                data-stack="h"
                data-gap="xs"
                data-align="center"
                data-justify="between"
                onBlur={hideTooltip}
                onFocus={showTooltip}
                onPointerEnter={showTooltipAtPointer}
                onPointerLeave={hideTooltip}
                onPointerMove={moveTooltip}
            >
                <h2 ref={titleRef} className={styles['title']}>
                    {shownTitle}
                </h2>
                <IconButton
                    tone="ghost"
                    aria-label="Rename"
                    data-test-id={editButtonTestId}
                    onClick={() => {
                        hideTooltip();
                        setEditing(true);
                    }}
                    data-px="none"
                    data-pb="none"
                    data-pt="xs"
                >
                    <PencilLine size={16} />
                </IconButton>
            </div>
        );
    }

    return (
        <div className={styles['root']} data-stack="v" data-gap="sm">
            {titleContent}
            {error ? <span className={styles['error']}>{error}</span> : null}
            {isTooltipOpen ? (
                <Tooltip id={tooltipId} ref={tooltipRef} className={styles['tooltip']}>
                    {shownTitle}
                </Tooltip>
            ) : null}
        </div>
    );
};
