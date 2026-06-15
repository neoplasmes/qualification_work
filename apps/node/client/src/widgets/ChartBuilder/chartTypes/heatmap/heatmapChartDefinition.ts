import type { ChartTypeDefinition } from '../../model';
import {
    configToHeatmapChartDraft,
    createHeatmapChartDraft,
    createHeatmapChartOutput,
    heatmapChartConfig,
    type HeatmapChartDraft,
} from './model';
import { HeatmapChartSettings } from './ui';

export const heatmapChartDefinition: ChartTypeDefinition<HeatmapChartDraft> = {
    chartType: 'heatmap',
    label: 'Heatmap',
    config: heatmapChartConfig,
    createDraft: createHeatmapChartDraft,
    configToDraft: configToHeatmapChartDraft,
    createOutput: createHeatmapChartOutput,
    Settings: HeatmapChartSettings,
};
