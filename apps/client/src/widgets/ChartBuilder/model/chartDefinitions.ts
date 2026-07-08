import { barChartDefinition, type BarChartDraft } from '../chartTypes/bar';
import { heatmapChartDefinition, type HeatmapChartDraft } from '../chartTypes/heatmap';
import { lineChartDefinition, type LineChartDraft } from '../chartTypes/line';
import { pieChartDefinition, type PieChartDraft } from '../chartTypes/pie';

export type ChartTypeDraft =
    | BarChartDraft
    | LineChartDraft
    | PieChartDraft
    | HeatmapChartDraft;

export const chartDefinitions = {
    bar: barChartDefinition,
    line: lineChartDefinition,
    pie: pieChartDefinition,
    heatmap: heatmapChartDefinition,
} as const;
