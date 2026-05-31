import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type {
    DatasetTableOptions,
    DatasetTableOptionsRepo,
} from './datasetTableOptions.repo';

const DB_NAME = 'datasetTableOptions';
const STORE_NAME = 'tableOptions';
const DB_VERSION = 1;

interface DatasetTableOptionsSchema extends DBSchema {
    [STORE_NAME]: {
        key: string;
        value: DatasetTableOptions;
    };
}

/**
 * IndexedDB-backed store for per-dataset table options, keyed by datasetId
 */
export class IdbDatasetTableOptionsRepo implements DatasetTableOptionsRepo {
    // opened lazily once and shared across calls
    private readonly db: Promise<IDBPDatabase<DatasetTableOptionsSchema>>;

    constructor() {
        this.db = openDB<DatasetTableOptionsSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @returns
     */
    async get(datasetId: string): Promise<DatasetTableOptions | undefined> {
        return (await this.db).get(STORE_NAME, datasetId);
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @param options
     * @returns
     */
    async set(datasetId: string, options: DatasetTableOptions): Promise<void> {
        await (await this.db).put(STORE_NAME, options, datasetId);
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @returns
     */
    async remove(datasetId: string): Promise<void> {
        await (await this.db).delete(STORE_NAME, datasetId);
    }
}
