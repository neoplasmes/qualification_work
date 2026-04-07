import { Children, useMemo, useRef } from 'react';

import type { WorkspaceGridGroupDirection } from '../../model';
import { WorkspaceGridPanelModelHandler } from '../../model/workspaceGridGroupModel';
import {
    WorkspaceGridPanelInternal,
    type WorkspaceGridPanelElementType,
    type WorkspaceGridPanelInternalElementType,
} from '../WorkspaceGridPanel';
import { WorkspaceGridResizer } from '../WorkspaceGridResizer';
import { isPanelElement } from './helpers';

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
export const WorkspaceGridGroup = ({ direction, children }: WorkspaceGridGroupProps) => {
    const panelHandlers = useRef<
        WeakMap<WorkspaceGridPanelInternalElementType, WorkspaceGridPanelModelHandler>
    >(new WeakMap());

    const panelsLinked = useMemo(() => {
        const childrenArray = Children.toArray(children).filter(
            isPanelElement
        ) as WorkspaceGridPanelElementType[];

        if (childrenArray.length === 1) {
            return childrenArray[0];
        }

        let i = 0;
        const handler = new WorkspaceGridPanelModelHandler();
        const linked: WorkspaceGridPanelInternalElementType[] = [
            <WorkspaceGridPanelInternal
                attach={handler.attach}
                external={childrenArray[i++]}
            />,
        ];
        panelHandlers.current.set(linked[0], handler);

        for (; i < childrenArray.length; ) {
            const prevWrapped = linked[i - 1];
            const prevHandler = panelHandlers.current.get(prevWrapped)!;

            const nextHandler = new WorkspaceGridPanelModelHandler();
            const nextWrapped = (
                <WorkspaceGridPanelInternal
                    attach={nextHandler.attach}
                    external={childrenArray[i++]}
                />
            );
            panelHandlers.current.set(nextWrapped, nextHandler);

            const resizer = (
                <WorkspaceGridResizer
                    direction={direction}
                    prevHandler={prevHandler}
                    nextHandler={nextHandler}
                />
            );

            linked.push(resizer, nextWrapped);
        }

        return linked;
    }, [children]);

    return (
        <div
            className={styles['workspace-grid-group']}
            style={{ '--direction': direction } as React.CSSProperties}
        >
            {panelsLinked}
        </div>
    );
};
