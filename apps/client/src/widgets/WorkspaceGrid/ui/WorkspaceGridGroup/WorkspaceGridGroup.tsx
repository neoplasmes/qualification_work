import React, { Children, useLayoutEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectPanelSizes,
    setPanelSizes,
    WorkspaceGridPanelModel,
    type WorkspaceGridCollapseController,
    type WorkspaceGridGroupDirection,
} from '../../model';
import { useWorkspaceGridConfig } from '../workspaceGridConfig';
import {
    WorkspaceGridPanelInternal,
    type WorkspaceGridPanelElementType,
} from '../WorkspaceGridPanel';
import { WorkspaceGridResizer } from '../WorkspaceGridResizer';
//@ts-ignore - language server lags
import { fitPanels, isPanelElement } from './helpers';

import styles from './WorkspaceGridGroup.module.scss';

type WorkspaceGridGroupProps<K extends string = string> = {
    direction: WorkspaceGridGroupDirection;
    pageKey?: string;
    /**
     * visible panel that receives extra free space when the group grows
     */
    growPanelKey?: string;
    /**
     * external collapse control, panels are addressed by their panelKey
     */
    collapse?: WorkspaceGridCollapseController<K>;
    /**
     * only WorkspaceGridPanel elements are allowed as children, otherwise behaviour is undefined
     */
    children: WorkspaceGridPanelElementType | WorkspaceGridPanelElementType[];
};

/**
 * a kind of linked-list of grid panels, where each panel is connected to the next one through
 * the resizer. any panel can be collapsed through the collapse controller, collapsed panels stay
 * mounted (their size is preserved) and resizers are wired only between visible neighbours.
 *
 * @returns
 */
export const WorkspaceGridGroup = <K extends string = string>({
    direction,
    children,
    pageKey,
    growPanelKey,
    collapse,
}: WorkspaceGridGroupProps<K>) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const { resizerSize } = useWorkspaceGridConfig();

    const savedSizes = useSelector(selectPanelSizes(pageKey ?? ''));

    const savedSizesRef = useRef(savedSizes);
    savedSizesRef.current = savedSizes;

    const modelsByIndex = useRef<Map<number, WorkspaceGridPanelModel>>(new Map());
    const directionRef = useRef(direction);

    const onResizeEndRef = useRef<() => void>(() => {});

    const { growPanelModel, linked, orderedModels, hidden } = useMemo(() => {
        const childrenArray = Children.toArray(children).filter(
            isPanelElement
        ) as WorkspaceGridPanelElementType[];

        const cache = modelsByIndex.current;

        if (directionRef.current !== direction) {
            cache.clear();
            directionRef.current = direction;
        }

        const orderedModels: WorkspaceGridPanelModel[] = [];
        const hidden: boolean[] = [];
        let growPanelModel: WorkspaceGridPanelModel | undefined;

        childrenArray.forEach((child, i) => {
            const { initialSize, minSize, maxSize, panelKey } = child.props;

            let model = cache.get(i);
            if (
                !model ||
                model.initialSize !== initialSize ||
                model.minSize !== minSize ||
                model.maxSize !== maxSize
            ) {
                model = new WorkspaceGridPanelModel(
                    direction,
                    initialSize,
                    minSize,
                    maxSize,
                    `panel-${i}`,
                    savedSizesRef.current?.[i]
                );
                cache.set(i, model);
            }

            orderedModels.push(model);
            if (panelKey === growPanelKey) {
                growPanelModel = model;
            }
            hidden.push(
                panelKey != null && (collapse?.isCollapsed(panelKey as K) ?? false)
            );
        });

        for (const key of cache.keys()) {
            if (key >= childrenArray.length) {
                cache.delete(key);
            }
        }

        const linked: React.ReactNode[] = [];
        let prevVisibleModel: WorkspaceGridPanelModel | null = null;

        childrenArray.forEach((child, i) => {
            const model = orderedModels[i];
            const isHidden = hidden[i];

            if (!isHidden && prevVisibleModel) {
                linked.push(
                    <WorkspaceGridResizer
                        key={`resizer-${i}`}
                        direction={direction}
                        prev={prevVisibleModel}
                        next={model}
                        onResizeEnd={onResizeEndRef}
                    />
                );
            }

            linked.push(
                <WorkspaceGridPanelInternal
                    key={`panel-${i}`}
                    attach={model.attach}
                    external={child}
                    hidden={isHidden}
                />
            );

            if (!isHidden) {
                prevVisibleModel = model;
            }
        });

        return { growPanelModel, linked, orderedModels, hidden };
    }, [children, direction, growPanelKey, collapse?.collapsed]);

    const orderedModelsRef = useRef(orderedModels);
    orderedModelsRef.current = orderedModels;

    onResizeEndRef.current = () => {
        if (!pageKey) {
            return;
        }

        const sizes = orderedModelsRef.current.map(model => model.getCurrentSizePx());
        dispatch(setPanelSizes({ pageKey, sizes }));
    };

    const applyFitRef = useRef<() => void>(() => {});
    applyFitRef.current = () => {
        const groupElement = groupRef.current;

        if (!groupElement || orderedModels.length === 0) {
            return;
        }

        const fullSize =
            direction === 'row' ? groupElement.clientWidth : groupElement.clientHeight;

        const visible = new Map<unknown, WorkspaceGridPanelModel>();
        orderedModels.forEach((model, i) => {
            if (!hidden[i]) {
                visible.set(model, model);
            }
        });

        const n = visible.size;
        const totalGapPx = n > 1 ? resizerSize * (n - 1) : 0;

        fitPanels(fullSize - totalGapPx, visible, growPanelModel);
    };

    useLayoutEffect(() => {
        const groupElement = groupRef.current;

        if (!groupElement) {
            return;
        }

        applyFitRef.current();

        const resizeObserver = new ResizeObserver(() => {
            applyFitRef.current();
        });

        resizeObserver.observe(groupElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // refit when the panel composition, direction or resizer size changes
    useLayoutEffect(() => {
        applyFitRef.current();
    }, [orderedModels, hidden, direction, resizerSize, growPanelModel]);

    return (
        <div
            className={styles['workspace-grid-group']}
            ref={groupRef}
            style={
                {
                    '--direction': direction,
                    '--resizer-size': `${resizerSize}px`,
                } as React.CSSProperties
            }
        >
            {linked}
        </div>
    );
};
