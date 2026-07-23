import { Button, HStack, Text, VStack } from '@qualification-work/design-system';

import { datasetsTestIds } from './const';
import { useDatasetsController } from './model';
import { DatasetWorkspace } from './ui/DatasetWorkspace';
import { UploadDatasetModal } from './ui/UploadDatasetModal';

import styles from './datasets.page.module.css';

export const DatasetsPage = () => {
    const {
        org,
        datasetsQuery,
        selectedDataset,
        showUpload,
        setShowUpload,
        handleUploadSuccess,
    } = useDatasetsController();

    return (
        <>
            <main
                className={styles['main-panel']}
                data-stack="v"
                data-flex
                data-test-id={datasetsTestIds.workspace}
            >
                <HStack className={styles.title} justify="space-between" gap={16} wrap>
                    <Text as="h1" variant="heading">
                        Данные
                    </Text>
                    <Text variant="label">{datasetsQuery.data?.length ?? 0} таблиц</Text>
                </HStack>
                {!selectedDataset && !datasetsQuery.isPending && (
                    <VStack className={styles.start} gap={20} align="start">
                        <Text as="h2" variant="heading-sm">
                            Начните с ваших данных
                        </Text>
                        <Text variant="body-sm" tone="muted">
                            Загрузите CSV или XLSX, чтобы просматривать и редактировать
                            таблицу.
                        </Text>
                        <Button disabled={!org} onClick={() => setShowUpload(true)}>
                            Загрузить таблицу
                        </Button>
                    </VStack>
                )}
                <DatasetWorkspace
                    key={`${org?.id ?? 'none'}/${selectedDataset?.dataset.id ?? 'none'}`}
                    selectedDataset={selectedDataset}
                />
            </main>

            {showUpload && (
                <UploadDatasetModal
                    key={org?.id ?? 'none'}
                    org={org}
                    onUploadSuccess={handleUploadSuccess}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </>
    );
};
