import React, { useRef } from 'react';

import { useRafThrottle } from '@/shared/lib/useRafThrottle';

import {
    type WorkspaceGridGroupDirection,
    type WorkspaceGridPanelModel,
} from '../../model';

import styles from './WorkspaceGridResizer.module.scss';

type WorkspaceGridResizerProps = {
    direction: WorkspaceGridGroupDirection;
    /**
     * vertical: prev - top, next - bottom
     * horizontal: prev - left, next - right
     */
    prev: WorkspaceGridPanelModel;
    /**
     * vertical: prev - top, next - bottom
     * horizontal: prev - left, next - right
     */
    next: WorkspaceGridPanelModel;
};

type ResizeState = {
    pointerId: number;
    startPosition: number;
    prevStartSize: number;
    nextStartSize: number;
};

export const WorkspaceGridResizer = ({
    direction,
    prev,
    next,
}: WorkspaceGridResizerProps) => {
    const resizeStateRef = useRef<ResizeState | null>(null);

    const applyResize = useRafThrottle<(position: number) => void>(position => {
        const resizeState = resizeStateRef.current;

        if (!resizeState) {
            return;
        }

        const delta = position - resizeState.startPosition;
        const minDelta = Math.max(
            prev.getMinSizePx() - resizeState.prevStartSize,
            resizeState.nextStartSize - next.getMaxSizePx()
        );
        const maxDelta = Math.min(
            prev.getMaxSizePx() - resizeState.prevStartSize,
            resizeState.nextStartSize - next.getMinSizePx()
        );

        const nextDelta = Math.min(maxDelta, Math.max(minDelta, delta));

        const nextPrevSize = resizeState.prevStartSize + nextDelta;
        const nextNextSize = resizeState.nextStartSize - nextDelta;

        if (nextPrevSize <= 0 || nextNextSize <= 0) {
            return;
        }

        prev.setSizePx(nextPrevSize);
        next.setSizePx(nextNextSize);
    });

    const onPointerDown: React.PointerEventHandler<HTMLDivElement> = event => {
        const prevElement = prev.getElement();
        const nextElement = next.getElement();

        if (!prevElement || !nextElement) {
            return;
        }

        resizeStateRef.current = {
            pointerId: event.pointerId,
            startPosition: direction === 'row' ? event.clientX : event.clientY,
            prevStartSize:
                direction === 'row' ? prevElement.offsetWidth : prevElement.offsetHeight,
            nextStartSize:
                direction === 'row' ? nextElement.offsetWidth : nextElement.offsetHeight,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const onPointerMove: React.PointerEventHandler<HTMLDivElement> = event => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return;
        }

        applyResize(direction === 'row' ? event.clientX : event.clientY);
    };

    const onPointerUp: React.PointerEventHandler<HTMLDivElement> = event => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return;
        }

        resizeStateRef.current = null;
    };

    const orientation = direction === 'row' ? styles['horizontal'] : styles['vertical'];

    return (
        <div className={styles['workspace-grid-resizer-base']}>
            <div
                className={`${styles['workspace-grid-resizer']} ${orientation}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onLostPointerCapture={onPointerUp}
            />
        </div>
    );
};
