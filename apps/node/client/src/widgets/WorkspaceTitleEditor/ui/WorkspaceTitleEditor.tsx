import { Check, PencilLine, X } from 'lucide-react';
import { useEffect, useState, type KeyboardEvent } from 'react';

import { IconButton, TextInput } from '@/shared/ui';

import styles from './WorkspaceTitleEditor.module.scss';

type WorkspaceTitleEditorProps = {
    title: string;
    fallbackTitle: string;
    eyebrow: string;
    meta?: string;
    editable?: boolean;
    saving?: boolean;
    editButtonTestId?: string;
    inputTestId?: string;
    onRename: (name: string) => Promise<void> | void;
};

export const WorkspaceTitleEditor = ({
    title,
    fallbackTitle,
    eyebrow,
    meta,
    editable = true,
    saving = false,
    editButtonTestId,
    inputTestId,
    onRename,
}: WorkspaceTitleEditorProps) => {
    const displayTitle = title.trim() || fallbackTitle;
    const [committedTitle, setCommittedTitle] = useState(displayTitle);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(displayTitle);
    const [error, setError] = useState('');
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

    return (
        <div data-stack="v" data-gap="sm">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>{eyebrow}</span>
                {editing ? (
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
                            size="sm"
                            aria-label="Save name"
                            disabled={saving}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => void commit()}
                        >
                            <Check size={16} />
                        </IconButton>
                        <IconButton
                            size="sm"
                            aria-label="Cancel rename"
                            disabled={saving}
                            onMouseDown={event => event.preventDefault()}
                            onClick={cancel}
                        >
                            <X size={16} />
                        </IconButton>
                    </div>
                ) : (
                    <div data-stack="h" data-gap="xs" data-align="center">
                        <h2 className={styles['title']}>{shownTitle}</h2>
                        {editable && (
                            <IconButton
                                size="sm"
                                tone="ghost"
                                aria-label="Rename"
                                data-test-id={editButtonTestId}
                                onClick={() => setEditing(true)}
                            >
                                <PencilLine size={16} />
                            </IconButton>
                        )}
                    </div>
                )}
                {meta ? <p className={styles['meta']}>{meta}</p> : null}
            </div>
            {error ? <span className={styles['error']}>{error}</span> : null}
        </div>
    );
};
