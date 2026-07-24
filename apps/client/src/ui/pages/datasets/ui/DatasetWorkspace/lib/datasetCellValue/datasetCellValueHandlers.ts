import { formatChartCell } from '@/ui/widgets/ChartShell';

import { isDayOfWeekValue } from '@/shared/lib/dayOfWeek';

import type { DatasetCellDataType, DatasetCellValueHandler } from './datasetCellValue';
import {
    formatDatasetDateCellValue,
    isValidDatasetDateCellValue,
    parseDatasetDateCellValue,
} from './datasetDateCellValue';

export const datasetCellValueHandlers = {
    number: {
        isValid: value => {
            const numberValue = Number(value);

            return !Number.isNaN(numberValue) && Number.isFinite(numberValue);
        },
        parse: Number,
        format: formatChartCell,
    },
    bool: {
        isValid: value => value === 'true' || value === 'false',
        parse: value => value === 'true',
        format: formatChartCell,
    },
    date: {
        isValid: isValidDatasetDateCellValue,
        parse: parseDatasetDateCellValue,
        format: formatDatasetDateCellValue,
    },
    day_of_week: {
        isValid: isDayOfWeekValue,
        parse: value => value.trim(),
        format: formatChartCell,
    },
    string: {
        isValid: () => true,
        parse: value => value,
        format: formatChartCell,
    },
} satisfies Record<DatasetCellDataType, DatasetCellValueHandler>;
