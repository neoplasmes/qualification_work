import { Upload, UploadCloud } from 'lucide-react';
import { useState } from 'react';

import { useUploadDatasetMutation } from '@/features/datasets';
import { getApiErrorMessage } from '@/shared/api';
import { Button, Dropzone } from '@/shared/ui';

import styles from './DatasetsPage.module.scss';

type DatasetsUploadPanelProps = {
    org: { id: string; name: string } | undefined;
    onUploadSuccess: (datasetId: string) => Promise<void>;
};

export const DatasetsUploadPanel = ({
    org,
    onUploadSuccess,
}: DatasetsUploadPanelProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadError, setUploadError] = useState('');
    const [uploadDataset, uploadState] = useUploadDatasetMutation();

    const handleFile = (file: File | undefined) => {
        setUploadError('');

        if (!file) {
            setSelectedFile(null);

            return;
        }

        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx')) {
            setSelectedFile(null);
            setUploadError('Choose a CSV or XLSX file.');

            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!org || !selectedFile) {
            return;
        }

        setUploadError('');

        try {
            const result = await uploadDataset({
                orgId: org.id,
                file: selectedFile,
            }).unwrap();
            setSelectedFile(null);
            await onUploadSuccess(result.id);
        } catch (error) {
            setUploadError(
                getApiErrorMessage(error, 'Unable to upload this dataset.')
            );
        }
    };

    return (
        <aside className={styles['side-panel']}>
            <div data-stack="v" data-gap="sm">
                <span className={styles['eyebrow']}>Workspace</span>
                <h1 className={styles['title']}>Datasets</h1>
                <p className={styles['muted']}>
                    {org
                        ? `Uploading to ${org.name}`
                        : 'No organization is available yet.'}
                </p>
            </div>

            <Dropzone
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Dataset file"
                onFile={handleFile}
            >
                <UploadCloud size={28} />
                <strong>Drop a CSV or XLSX file</strong>
                <span className={styles['muted']}>
                    Wide files are fine. The first rows are used for type inference.
                </span>
            </Dropzone>

            {selectedFile && (
                <div className={styles['status']}>
                    Selected: {selectedFile.name}
                </div>
            )}

            {uploadError && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {uploadError}
                </div>
            )}

            <Button
                disabled={!selectedFile || !org || uploadState.isLoading}
                onClick={() => void handleUpload()}
            >
                <Upload size={18} />
                {uploadState.isLoading ? 'Uploading' : 'Upload dataset'}
            </Button>
        </aside>
    );
};
