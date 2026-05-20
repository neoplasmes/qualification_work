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
        // expand last panel to fill remaining space
        const last = models[models.length - 1];
        last.setFittedSizePx(sizes[sizes.length - 1] + availableSize - totalSize);
    }
};
