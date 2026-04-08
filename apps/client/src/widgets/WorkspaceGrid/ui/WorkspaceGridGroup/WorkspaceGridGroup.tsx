import React, { Children, useLayoutEffect, useMemo, useRef } from 'react';

import { WorkspaceGridPanelModel, type WorkspaceGridGroupDirection } from '../../model';
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
}: WorkspaceGridGroupProps) => {
    const groupRef = useRef<HTMLDivElement>(null);

    const panelModels = useRef<
        Map<WorkspaceGridPanelInternalElementType, WorkspaceGridPanelModel>
    >(new Map());

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
            `panel-${i}`
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
                nextKey
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
            const availableSize =
                direction === 'row'
                    ? groupElement.clientWidth
                    : groupElement.clientHeight;

            fitPanels(availableSize, panelModels.current);
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
        >
            {linked}
        </div>
    );
};
