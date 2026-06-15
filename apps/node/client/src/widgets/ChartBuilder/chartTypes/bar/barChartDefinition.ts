import type { ChartTypeDefinition } from '../../model';
import {
    barChartConfig,
    configToBarChartDraft,
    createBarChartDraft,
    createBarChartOutput,
    type BarChartDraft,
} from './model';
import { BarChartSettings } from './ui';

export const barChartDefinition: ChartTypeDefinition<BarChartDraft> = {
    chartType: 'bar',
    label: 'Bar',
    config: barChartConfig,
    createDraft: createBarChartDraft,
    configToDraft: configToBarChartDraft,
    createOutput: createBarChartOutput,
    Settings: BarChartSettings,
};
