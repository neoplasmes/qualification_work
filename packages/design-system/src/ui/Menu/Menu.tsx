import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import { Text } from '../Text';
import styles from './menu.module.css';

export type MenuProps = Omit<ComponentPropsWithRef<typeof BaseMenu.Root>, 'children'> & {
    trigger: ReactNode;
    items: readonly { id: string; label: ReactNode; href?: string; onClick?: () => void; disabled?: boolean; quiet?: boolean; separatorBefore?: boolean }[];
    description?: ReactNode;
    className?: string;
    triggerClassName?: string;
    triggerProps?: Omit<ComponentPropsWithRef<typeof Button>, 'children'>;
};

export function Menu({ trigger, items, description, className, triggerClassName, triggerProps, ...props }: MenuProps) {
    return <BaseMenu.Root {...props}>
        <BaseMenu.Trigger render={<Button variant="ghost" {...triggerProps} className={[triggerProps?.className, triggerClassName].filter(Boolean).join(' ') || undefined} />}>{trigger}<ChevronDown size={12} aria-hidden="true" /></BaseMenu.Trigger>
        <BaseMenu.Portal>
            <BaseMenu.Positioner sideOffset={8} align="end" className={styles.positioner}>
                <BaseMenu.Popup data-theme="paper" className={`${styles.popup}${className ? ` ${className}` : ''}`}>
                    {description ? <Text variant="label" tone="mutedCanvas">{description}</Text> : null}
                    {items.map((item) => <BaseMenu.Group key={item.id}>
                        {item.separatorBefore ? <BaseMenu.Separator className={styles.separator} /> : null}
                        {item.href && !item.disabled ? <BaseMenu.LinkItem closeOnClick href={item.href} onClick={item.onClick} className={`${styles.item}${item.quiet ? ` ${styles.quiet}` : ''}`}>{item.label}</BaseMenu.LinkItem> : <BaseMenu.Item disabled={item.disabled} onClick={item.onClick} className={`${styles.item}${item.quiet ? ` ${styles.quiet}` : ''}`}>{item.label}</BaseMenu.Item>}
                    </BaseMenu.Group>)}
                </BaseMenu.Popup>
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    </BaseMenu.Root>;
}
