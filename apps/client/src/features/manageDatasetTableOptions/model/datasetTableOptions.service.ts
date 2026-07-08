import type { ColumnWidths, DatasetTableOptionsRepo } from './datasetTableOptions.repo';

// keep only positive finite widths
const sanitizeWidths = (raw: ColumnWidths | undefined): ColumnWidths => {
    if (!raw) {
        return {};
    }

    const out: ColumnWidths = {};
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            out[key] = value;
        }
    }

    return out;
};

/**
 * Business logic over the table options repository
 */
export class DatasetTableOptionsService {
    constructor(private readonly repo: DatasetTableOptionsRepo) {}

    /**
     * Description placeholder
     *
     * @param datasetId
     * @returns
     */
    async getColumnWidths(datasetId: string): Promise<ColumnWidths> {
        const options = await this.repo.get(datasetId);

        return sanitizeWidths(options?.columnWidths);
    }

    /**
     * Description placeholder
     *
     * @param datasetId
     * @param widths
     * @returns
     */
    async saveColumnWidths(datasetId: string, widths: ColumnWidths): Promise<void> {
        const current = await this.repo.get(datasetId);

        // keep other future option fields intact
        await this.repo.set(datasetId, {
            ...current,
            columnWidths: sanitizeWidths(widths),
        });
    }
}
