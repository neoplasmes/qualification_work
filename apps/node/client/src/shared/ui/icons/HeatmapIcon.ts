import { createLucideIcon, type IconNode } from 'lucide-react';

// 3x3 grid with a few cells filled at different intensities, drawn behind a
// crisp grid overlay so it reads as a heatmap
const iconNode: IconNode = [
    ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2', key: 'frame' }],
    [
        'rect',
        {
            width: '6',
            height: '6',
            x: '9',
            y: '3',
            fill: 'currentColor',
            stroke: 'none',
            fillOpacity: '0.35',
            key: 'cell-top',
        },
    ],
    [
        'rect',
        {
            width: '6',
            height: '6',
            x: '9',
            y: '9',
            fill: 'currentColor',
            stroke: 'none',
            fillOpacity: '0.6',
            key: 'cell-center',
        },
    ],
    [
        'rect',
        {
            width: '6',
            height: '6',
            x: '15',
            y: '9',
            fill: 'currentColor',
            stroke: 'none',
            fillOpacity: '0.9',
            key: 'cell-right',
        },
    ],
    ['path', { d: 'M3 9h18', key: 'line-h1' }],
    ['path', { d: 'M3 15h18', key: 'line-h2' }],
    ['path', { d: 'M9 3v18', key: 'line-v1' }],
    ['path', { d: 'M15 3v18', key: 'line-v2' }],
];

export const HeatmapIcon = createLucideIcon('heatmap', iconNode);
