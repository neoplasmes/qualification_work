import { NotFoundError } from '@/core/errors';
import type { DatasetRepo, DatasetRowsPage } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class GetDatasetRowsQuery implements Executable<
    [string, number, number],
    Promise<DatasetRowsPage>
> {
    constructor(private readonly datasetRepository: DatasetRepo) {}

    async execute(id: string, offset: number, limit: number) {
        const rowsPage = await this.datasetRepository.getDatasetRowsPageById({
            datasetId: id,
            offset: offset,
            limit: limit,
        });

        if (!rowsPage) {
            throw new NotFoundError('Dataset not found');
        }

        return rowsPage;
    }
}

export type GetDatasetRowsQueryIO = ExecutableIO<GetDatasetRowsQuery>;
