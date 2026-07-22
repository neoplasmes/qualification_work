import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type {
    DatasetTableOptions,
    DatasetTableOptionsRepo,
} from '@/app/ports/repos/datasetTableOptions';

const dbName = 'datasetTableOptions';
const storeName = 'tableOptions';
const dbVersion = 1;

interface DatasetTableOptionsSchema extends DBSchema {
    [storeName]: {
        key: string;
        value: DatasetTableOptions;
    };
}

/**
 * IndexedDB-backed store for per-dataset table options, keyed by datasetId
 */
export class IdbDatasetTableOptionsRepo implements DatasetTableOptionsRepo {
    // opened lazily once and shared across calls
    private db: Promise<IDBPDatabase<DatasetTableOptionsSchema>> | undefined;

    private open() {
        this.db ??= openDB<DatasetTableOptionsSchema>(dbName, dbVersion, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            },
        });

        return this.db;
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @returns
     */
    async get(datasetId: string): Promise<DatasetTableOptions | undefined> {
        return (await this.open()).get(storeName, datasetId);
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @param options
     * @returns
     */
    async set(datasetId: string, options: DatasetTableOptions): Promise<void> {
        await (await this.open()).put(storeName, options, datasetId);
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @returns
     */
    async remove(datasetId: string): Promise<void> {
        await (await this.open()).delete(storeName, datasetId);
    }
}
