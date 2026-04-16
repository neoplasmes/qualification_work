import type { PropsWithChildren, ReactNode } from 'react';

type SideBarProps = PropsWithChildren<{
    headElement: ReactNode;
}>;

export const SideBar = ({ headElement, children }: SideBarProps) => {
    return (
        <div data-stack="v">
            <div data-stack="h" data-align="center">
                {headElement}
            </div>
            <div data-stack="h">{children}</div>
        </div>
    );
};
