import type { ChartTypeDefinition } from '../../model';
import {
    barChartConfig,
    configToBarChartDraft,
    createBarChartDraft,
    draftToBarChartBuilderOutput,
    type BarChartDraft,
} from './model';
import { BarChartSettings } from './ui';

export const barChartDefinition: ChartTypeDefinition<BarChartDraft> = {
    chartType: 'bar',
    label: 'Столбцы',
    config: barChartConfig,
    createDraft: createBarChartDraft,
    configToDraft: configToBarChartDraft,
    createOutput: draftToBarChartBuilderOutput,
    Settings: BarChartSettings,
};
