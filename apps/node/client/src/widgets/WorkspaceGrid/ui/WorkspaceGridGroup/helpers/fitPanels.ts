import type { WorkspaceGridPanelModel } from '../../../model';

/**
 * Description placeholder
 *
 * @param {number} availableSize
 * @param {Map<unknown, WorkspaceGridPanelModel>} panelModels - we don't care what kind of a keys we have,
 * we only need to iterate over the map
 */
export const fitPanels = (
    availableSize: number,
    panelModels: Map<unknown, WorkspaceGridPanelModel>
) => {
    if (availableSize <= 0 || panelModels.size === 0) {
        return;
    }

    const nextSizes: number[] = [];

    panelModels.forEach(model => {
        nextSizes.push(model.getCurrentSizePx());
    });

    const totalSize = nextSizes.reduce((sum, size) => sum + size, 0);

    if (totalSize <= availableSize || totalSize <= 0) {
        return;
    }

    const shrinkRatio = availableSize / totalSize;

    const fittedSizes = nextSizes.map(size => size * shrinkRatio);
    let i = 0;
    panelModels.forEach(model => {
        model.setFittedSizePx(fittedSizes[i++]);
    });
};
