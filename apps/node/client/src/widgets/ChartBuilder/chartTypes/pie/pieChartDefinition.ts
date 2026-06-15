import type { ChartTypeDefinition } from '../../model';
import {
    configToPieChartDraft,
    createPieChartDraft,
    createPieChartOutput,
    pieChartConfig,
    type PieChartDraft,
} from './model';
import { PieChartSettings } from './ui';

export const pieChartDefinition: ChartTypeDefinition<PieChartDraft> = {
    chartType: 'pie',
    label: 'Pie',
    config: pieChartConfig,
    createDraft: createPieChartDraft,
    configToDraft: configToPieChartDraft,
    createOutput: createPieChartOutput,
    Settings: PieChartSettings,
};
