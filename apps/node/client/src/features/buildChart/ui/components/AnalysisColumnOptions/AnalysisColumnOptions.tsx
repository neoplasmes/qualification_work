import type { DatasetColumn } from '@/entities/dataset';

type AnalysisColumnOptionsProps = {
    columns: DatasetColumn[];
};

export const AnalysisColumnOptions = ({ columns }: AnalysisColumnOptionsProps) => (
    <>
        {columns.map(column => (
            <option
                key={column.id}
                value={column.id}
                disabled={column.isAnalyzable === false}
            >
                {column.displayName}
            </option>
        ))}
    </>
);
