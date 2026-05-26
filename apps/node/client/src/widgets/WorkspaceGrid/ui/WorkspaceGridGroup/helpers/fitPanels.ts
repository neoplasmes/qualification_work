import type { WorkspaceGridPanelModel } from '../../../model';

/**
 * @param availableSize - space for panels only (CSS gap between items excluded)
 * @param panelModels - we don't care what kind of a keys we have,
 * we only need to iterate over the map
 */
export const fitPanels = (
    availableSize: number,
    panelModels: Map<unknown, WorkspaceGridPanelModel>
) => {
    if (availableSize <= 0 || panelModels.size === 0) {
        return;
    }

    const models = [...panelModels.values()];
    const sizes = models.map(m => m.getCurrentSizePx());
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);

    if (totalSize <= 0) {
        return;
    }

    if (totalSize > availableSize) {
        const shrinkRatio = availableSize / totalSize;
        models.forEach((model, i) => model.setFittedSizePx(sizes[i] * shrinkRatio));
    } else if (totalSize < availableSize) {
        // expand the second-to-last panel (center content area) so edge panels stay near their
        // initial size and remain freely resizable; fall back to last panel for <= 2 panels
        const targetIdx = models.length > 2 ? models.length - 2 : models.length - 1;
        models[targetIdx].setFittedSizePx(sizes[targetIdx] + availableSize - totalSize);
    }
};
