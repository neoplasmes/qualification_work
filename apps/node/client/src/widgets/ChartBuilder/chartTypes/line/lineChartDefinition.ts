import type { ChartTypeDefinition } from '../../model';
import {
    configToLineChartDraft,
    createLineChartDraft,
    createLineChartOutput,
    lineChartConfig,
    type LineChartDraft,
} from './model';
import { LineChartSettings } from './ui';

export const lineChartDefinition: ChartTypeDefinition<LineChartDraft> = {
    chartType: 'line',
    label: 'Line',
    config: lineChartConfig,
    createDraft: createLineChartDraft,
    configToDraft: configToLineChartDraft,
    createOutput: createLineChartOutput,
    Settings: LineChartSettings,
};
