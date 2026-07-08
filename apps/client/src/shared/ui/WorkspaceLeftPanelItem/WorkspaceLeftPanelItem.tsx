import {
    useId,
    useRef,
    useState,
    type ReactNode,
    type PointerEvent as ReactPointerEvent,
} from 'react';

import { Tooltip } from '../Tooltip';
import { applyPointerTooltipPosition, getPointerTooltipPosition } from '../Tooltip/lib';

import styles from './WorkspaceLeftPanelItem.module.scss';

const tooltipGap = 8;
const tooltipMargin = 8;
const tooltipMaxWidth = 260;

type WorkspaceLeftPanelItemProps = {
    header: ReactNode;
    headerTooltip?: string;
    details?: ReactNode[];
    iconElement?: ReactNode;
    selected?: boolean;
    testId?: string;
    onClick: () => void;
};

export const WorkspaceLeftPanelItem = ({
    header,
    headerTooltip,
    details = [],
    iconElement,
    selected = false,
    testId,
    onClick,
}: WorkspaceLeftPanelItemProps) => {
    const headerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const tooltipFrameRef = useRef<number | null>(null);
    const tooltipId = useId();
    const tooltipText = getTooltipText(header, headerTooltip);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);

    const canShowTooltip = () => {
        const headerElement = headerRef.current;

        return Boolean(
            headerElement &&
            tooltipText &&
            headerElement.scrollWidth > headerElement.clientWidth
        );
    };

    const updateTooltipPosition = (clientX: number, clientY: number) => {
        const position = getPointerTooltipPosition({
            clientX,
            clientY,
            viewportWidth: window.innerWidth,
            gap: tooltipGap,
            margin: tooltipMargin,
            maxWidth: tooltipMaxWidth,
        });

        if (tooltipFrameRef.current !== null) {
            window.cancelAnimationFrame(tooltipFrameRef.current);
        }

        tooltipFrameRef.current = window.requestAnimationFrame(() => {
            tooltipFrameRef.current = null;
            applyPointerTooltipPosition(tooltipRef.current, position);
        });
    };

    const showTooltip = () => {
        if (!canShowTooltip()) {
            setIsTooltipOpen(false);

            return;
        }

        setIsTooltipOpen(true);
    };

    const showTooltipAtPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (!canShowTooltip()) {
            setIsTooltipOpen(false);

            return;
        }

        updateTooltipPosition(event.clientX, event.clientY);
        setIsTooltipOpen(true);
    };

    const moveTooltip = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (isTooltipOpen) {
            updateTooltipPosition(event.clientX, event.clientY);
        }
    };

    const hideTooltip = () => {
        if (tooltipFrameRef.current !== null) {
            window.cancelAnimationFrame(tooltipFrameRef.current);
            tooltipFrameRef.current = null;
        }

        setIsTooltipOpen(false);
    };

    return (
        <>
            <button
                type="button"
                aria-describedby={isTooltipOpen ? tooltipId : undefined}
                data-test-id={testId}
                data-stack="h"
                data-gap="sm"
                data-py="sm"
                data-px="md"
                data-align="center"
                data-justify="between"
                className={`${styles['item']} ${selected ? styles['selected'] : ''}`}
                onBlur={hideTooltip}
                onClick={onClick}
                onFocus={showTooltip}
                onPointerEnter={showTooltipAtPointer}
                onPointerLeave={hideTooltip}
                onPointerMove={moveTooltip}
            >
                <div className={styles['body']} data-flex>
                    <div ref={headerRef} className={styles['header']}>
                        {header}
                    </div>
                    {details.length > 0 ? (
                        <div
                            className={styles['details']}
                            data-stack="h"
                            data-gap="sm"
                            data-wrap="wrap"
                        >
                            {details.map((value, index) => (
                                <span key={index}>{value}</span>
                            ))}
                        </div>
                    ) : null}
                </div>
                {iconElement ? (
                    <div
                        className={styles['icon']}
                        data-display="inline-flex"
                        data-align="center"
                        data-justify="center"
                    >
                        {iconElement}
                    </div>
                ) : null}
            </button>
            {isTooltipOpen ? (
                <Tooltip id={tooltipId} ref={tooltipRef} className={styles['tooltip']}>
                    {tooltipText}
                </Tooltip>
            ) : null}
        </>
    );
};

const getTooltipText = (header: ReactNode, headerTooltip?: string) => {
    if (headerTooltip) {
        return headerTooltip;
    }

    if (typeof header === 'string' || typeof header === 'number') {
        return String(header);
    }

    return undefined;
};
