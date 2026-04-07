import {
    WorkspaceGridPanel,
    type WorkspaceGridPanelElementType,
} from '../WorkspaceGridPanel';

/**
 * PanelElementValidator
 *
 * @param {React.ReactNode} element
 * @returns {element is WorkspaceGridPanelElementType}
 */
export const isPanelElement = (
    element: React.ReactNode
): element is WorkspaceGridPanelElementType => {
    const bool =
        typeof element === 'object' &&
        element !== null &&
        'type' in element &&
        element.type === WorkspaceGridPanel;

    if (!bool) {
        console.warn(
            'WorkspaceGridGroup: only WorkspaceGridPanel elements are allowed as children'
        );
    }

    return bool;
};
