import { Text } from '@qualification-work/design-system';
import { Upload } from 'lucide-react';

import { datasetsTestIds } from '../../../../const';

import styles from './mergeFilesSection.module.css';

type MergeFilesSectionProps = {
    files: File[];
    disabled?: boolean;
    onFilesChange: (files: File[]) => void;
};

export const MergeFilesSection = ({
    files,
    disabled,
    onFilesChange,
}: MergeFilesSectionProps) => (
    <>
        <label className={styles['file-picker-control']}>
            <Upload size={20} />
            <Text variant="lead">Выберите CSV или XLSX</Text>
            <Text variant="body-sm" tone="muted">
                Можно выбрать несколько файлов.
            </Text>
            <input
                data-test-id={datasetsTestIds.mergeFileInput}
                type="file"
                disabled={disabled}
                aria-label="Файлы для объединения"
                multiple
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className={styles['file-picker-input']}
                onChange={event =>
                    onFilesChange(Array.from(event.currentTarget.files ?? []))
                }
            />
        </label>
        {files.length > 0 && (
            <div className={styles['file-names']}>
                {files.map(file => (
                    <span key={`${file.name}-${file.size}`}>{file.name}</span>
                ))}
            </div>
        )}
    </>
);
