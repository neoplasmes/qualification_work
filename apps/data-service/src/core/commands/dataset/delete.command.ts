import type { DatasetRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

export class DeleteDatasetCommand implements Executable<[string], Promise<void>> {
    constructor(private readonly datasetRepo: DatasetRepo) {}

    async execute(datasetId: string): Promise<void> {
        await this.datasetRepo.deleteById(datasetId);
    }
}

export type DeleteDatasetCommandIO = ExecutableIO<DeleteDatasetCommand>;
