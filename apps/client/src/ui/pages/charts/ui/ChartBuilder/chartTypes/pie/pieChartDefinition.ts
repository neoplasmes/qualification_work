import type { ChartTypeDefinition } from '../../model';
import {
    configToPieChartDraft,
    createPieChartDraft,
    draftToPieChartBuilderOutput,
    pieChartConfig,
    type PieChartDraft,
} from './model';
import { PieChartSettings } from './ui';

export const pieChartDefinition: ChartTypeDefinition<PieChartDraft> = {
    chartType: 'pie',
    label: 'Круговая диаграмма',
    config: pieChartConfig,
    createDraft: createPieChartDraft,
    configToDraft: configToPieChartDraft,
    createOutput: draftToPieChartBuilderOutput,
    Settings: PieChartSettings,
};
