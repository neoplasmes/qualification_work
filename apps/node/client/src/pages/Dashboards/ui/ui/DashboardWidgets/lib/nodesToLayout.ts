import type { DashboardItemLayoutInput } from '@qualification-work/types';
import type { GridStackNode, GridStackWidget } from 'gridstack';

/**
 * maps gridstack nodes to the layout persistence payload
 * nodes without an id or geometry are skipped
 *
 * @param nodes
 * @returns
 */
type LayoutNode = Pick<GridStackNode | GridStackWidget, 'id' | 'x' | 'y' | 'w' | 'h'>;

export const nodesToLayout = (nodes: LayoutNode[]): DashboardItemLayoutInput[] =>
    nodes
        .filter(
            node =>
                node.id != null &&
                node.x != null &&
                node.y != null &&
                node.w != null &&
                node.h != null
        )
        .map(node => ({
            itemId: String(node.id),
            posX: node.x as number,
            posY: node.y as number,
            width: node.w as number,
            height: node.h as number,
        }))
        .sort((a, b) => a.posY - b.posY || a.posX - b.posX);
