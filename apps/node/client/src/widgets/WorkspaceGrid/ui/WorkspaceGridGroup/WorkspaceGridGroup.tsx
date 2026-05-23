import React, { Children, useLayoutEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    WorkspaceGridPanelModel,
    type WorkspaceGridGroupDirection,
    selectPanelSizes,
    setPanelSizes,
} from '../../model';
import {
    WorkspaceGridPanelInternal,
    type WorkspaceGridPanelElementType,
    type WorkspaceGridPanelInternalElementType,
} from '../WorkspaceGridPanel';
import { WorkspaceGridResizer } from '../WorkspaceGridResizer';
//@ts-ignore - language server lags
import { fitPanels, isPanelElement } from './helpers';

import styles from './WorkspaceGridGroup.module.scss';

type WorkspaceGridGroupProps = {
    direction: WorkspaceGridGroupDirection;
    pageKey?: string;
    collapseLeft?: boolean;
    collapseRight?: boolean;
    /**
     * only WorkspaceGridPanel elements are allowed as children, otherwise behaviour is undefined
     */
    children: WorkspaceGridPanelElementType | WorkspaceGridPanelElementType[];
};

/**
 * a kind of linked-list of grid panels, where each panel is connected to the next one through
 * the resizer.
 *
 * @returns
 */
export const WorkspaceGridGroup: React.FC<WorkspaceGridGroupProps> = ({
    direction,
    children,
    pageKey,
    collapseLeft = false,
    collapseRight = false,
}: WorkspaceGridGroupProps) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const savedSizes = useSelector(selectPanelSizes(pageKey ?? ''));

    // always-fresh ref: updated before useMemo so re-runs always get current Redux sizes
    const savedSizesRef = useRef(savedSizes);
    savedSizesRef.current = savedSizes;

    const panelModels = useRef<
        Map<WorkspaceGridPanelInternalElementType, WorkspaceGridPanelModel>
    >(new Map());

    // always-fresh callback: reads current sizes of all panels and persists to Redux
    const onResizeEndRef = useRef<() => void>(() => {});
    onResizeEndRef.current = () => {
        if (!pageKey) {
            return;
        }

        const sizes = [...panelModels.current.values()].map(model =>
            model.getCurrentSizePx()
        );
        dispatch(setPanelSizes({ pageKey, sizes }));
    };

    const linked = useMemo(() => {
        const childrenArray = Children.toArray(children).filter(
            isPanelElement
        ) as WorkspaceGridPanelElementType[];

        panelModels.current = new Map<
            WorkspaceGridPanelInternalElementType,
            WorkspaceGridPanelModel
        >();

        if (childrenArray.length === 0) {
            return [];
        } else if (childrenArray.length === 1) {
            return [childrenArray[0]];
        }

        let i = 0;

        const firstModel = new WorkspaceGridPanelModel(
            direction,
            childrenArray[0].props.initialSize,
            childrenArray[0].props.minSize,
            childrenArray[0].props.maxSize,
            `panel-${i}`,
            savedSizesRef.current?.[0]
        );
        const linked = [
            <WorkspaceGridPanelInternal
                key={`panel-${i}`}
                attach={firstModel.attach}
                external={childrenArray[i++]}
            />,
        ];
        panelModels.current.set(linked[0], firstModel);

        for (; i < childrenArray.length; ) {
            const prevWrapped = linked[i - 1];
            const prevModel = panelModels.current.get(prevWrapped)!;

            const nextKey = `panel-${i}`;
            const nextModel = new WorkspaceGridPanelModel(
                direction,
                childrenArray[i].props.initialSize,
                childrenArray[i].props.minSize,
                childrenArray[i].props.maxSize,
                nextKey,
                savedSizesRef.current?.[i]
            );
            const nextWrapped = (
                <WorkspaceGridPanelInternal
                    key={nextKey}
                    attach={nextModel.attach}
                    external={childrenArray[i++]}
                />
            );

            panelModels.current.set(nextWrapped, nextModel);

            linked.push(
                <WorkspaceGridResizer
                    key={`resizer-${i}`}
                    direction={direction}
                    prev={prevModel}
                    next={nextModel}
                    onResizeEnd={onResizeEndRef}
                />,
                nextWrapped
            );
        }

        return linked;
    }, [children, direction]);

    useLayoutEffect(() => {
        const groupElement = groupRef.current;

        if (!groupElement || panelModels.current.size === 0) {
            return;
        }

        const applyFit = () => {
            const fullSize =
                direction === 'row'
                    ? groupElement.clientWidth
                    : groupElement.clientHeight;

            const gapPx =
                parseFloat(
                    window
                        .getComputedStyle(groupElement)
                        .getPropertyValue(
                            direction === 'row' ? 'column-gap' : 'row-gap'
                        )
                ) || 0;

            // n panels + (n-1) resizerss = 2n-1 flex items, total gaps = 2(n-1)
            const n = panelModels.current.size;
            const totalGapPx = n > 1 ? gapPx * 2 * (n - 1) : 0;

            fitPanels(fullSize - totalGapPx, panelModels.current);
        };

        applyFit();

        const resizeObserver = new ResizeObserver(() => {
            applyFit();
        });

        resizeObserver.observe(groupElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, [direction, panelModels.current]);

    return (
        <div
            className={styles['workspace-grid-group']}
            ref={groupRef}
            style={{ '--direction': direction } as React.CSSProperties}
            data-collapse-left={collapseLeft || undefined}
            data-collapse-right={collapseRight || undefined}
        >
            {linked}
        </div>
    );
};
