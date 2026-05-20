import type { DragEvent, FC, ReactNode } from 'react';

import styles from './Dropzone.module.scss';

type DropzoneProps = {
    accept: string;
    'aria-label': string;
    onFile: (file: File | undefined) => void;
    children: ReactNode;
};

export const Dropzone: FC<DropzoneProps> = ({
    accept,
    'aria-label': ariaLabel,
    onFile,
    children,
}) => {
    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        onFile(event.dataTransfer.files[0]);
    };

    return (
        <label
            className={styles['dropzone']}
            onDragOver={event => event.preventDefault()}
            onDrop={handleDrop}
        >
            {children}
            <input
                className={styles['file-input']}
                type="file"
                accept={accept}
                aria-label={ariaLabel}
                onChange={event => onFile(event.currentTarget.files?.[0])}
            />
        </label>
    );
};
