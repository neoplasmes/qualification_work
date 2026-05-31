import { ChartColumn, ChartLine, ChartPie, type LucideIcon } from 'lucide-react';

import { HeatmapIcon } from '@/shared/ui/icons';

import type { ChartKind } from './chartKind';

// icon per chart kind for compact list rendering
export const CHART_KIND_ICONS: Record<ChartKind, LucideIcon> = {
    bar: ChartColumn,
    line: ChartLine,
    pie: ChartPie,
    heatmap: HeatmapIcon,
};
