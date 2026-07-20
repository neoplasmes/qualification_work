import { Upload } from 'lucide-react';

import { datasetsTestIds } from '../../../../const';

import styles from './MergeFilesSection.module.css';

type MergeFilesSectionProps = {
    files: File[];
    onFilesChange: (files: File[]) => void;
};

export const MergeFilesSection = ({ files, onFilesChange }: MergeFilesSectionProps) => (
    <>
        <label className={styles['file-picker-control']}>
            <Upload size={20} />
            <span>Choose CSV or XLSX files</span>
            <small>Multiple files can be selected at once.</small>
            <input
                data-test-id={datasetsTestIds.mergeFileInput}
                type="file"
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
