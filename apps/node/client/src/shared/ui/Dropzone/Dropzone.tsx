import type { DragEvent, FC, ReactNode } from 'react';

import styles from './Dropzone.module.scss';

type DropzoneProps = {
    accept: string;
    'aria-label': string;
    multiple?: boolean;
    onFile?: (file: File | undefined) => void;
    onFiles?: (files: File[]) => void;
    children: ReactNode;
};

export const Dropzone: FC<DropzoneProps> = ({
    accept,
    'aria-label': ariaLabel,
    multiple = false,
    onFile,
    onFiles,
    children,
}) => {
    const handleFiles = (fileList: FileList | null | undefined) => {
        const files = Array.from(fileList ?? []);
        if (onFiles) {
            onFiles(files);

            return;
        }

        onFile?.(files[0]);
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
    };

    return (
        <label
            data-stack="v"
            data-gap="sm"
            data-align="start"
            data-p="md"
            className={styles['dropzone']}
            onDragOver={event => event.preventDefault()}
            onDrop={handleDrop}
        >
            {children}
            <input
                className={styles['file-input']}
                type="file"
                accept={accept}
                multiple={multiple}
                aria-label={ariaLabel}
                onChange={event => {
                    handleFiles(event.currentTarget.files);
                    event.currentTarget.value = '';
                }}
            />
        </label>
    );
};
