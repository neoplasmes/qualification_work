import React, { useRef } from 'react';

import { useRafThrottle } from '@/shared/lib/useRafThrottle';

import {
    type WorkspaceGridGroupDirection,
    type WorkspaceGridPanelModelHandler,
} from '../../model';

import styles from './WorkspaceGridResizer.module.scss';

type WorkspaceGridResizerProps = {
    direction: WorkspaceGridGroupDirection;
    /**
     * vertical: prev - top, next - bottom
     * horizontal: prev - left, next - right
     */
    prevHandler: WorkspaceGridPanelModelHandler;
    /**
     * vertical: prev - top, next - bottom
     * horizontal: prev - left, next - right
     */
    nextHandler: WorkspaceGridPanelModelHandler;
};

type ResizeState = {
    pointerId: number;
    startPosition: number;
    prevStartSize: number;
    nextStartSize: number;
};

export const WorkspaceGridResizer = ({
    direction,
    prevHandler,
    nextHandler,
}: WorkspaceGridResizerProps) => {
    const resizeStateRef = useRef<ResizeState | null>(null);

    const applyResize = useRafThrottle<(position: number) => void>(position => {
        const resizeState = resizeStateRef.current;

        if (!resizeState) {
            return;
        }

        const delta = position - resizeState.startPosition;
        const nextPrevSize = resizeState.prevStartSize + delta;
        const nextNextSize = resizeState.nextStartSize - delta;

        if (nextPrevSize <= 0 || nextNextSize <= 0) {
            return;
        }

        if (direction === 'row') {
            prevHandler.setWidth(`${nextPrevSize}px`);
            nextHandler.setWidth(`${nextNextSize}px`);

            return;
        }

        prevHandler.setHeight(`${nextPrevSize}px`);
        nextHandler.setHeight(`${nextNextSize}px`);
    });

    const onPointerDown: React.PointerEventHandler<HTMLDivElement> = event => {
        const prevElement = prevHandler.getElement();
        const nextElement = nextHandler.getElement();

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
