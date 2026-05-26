import type { DashboardItem } from '@/entities/dashboard';

export const moveDashboardItem = (
    items: DashboardItem[],
    itemId: string,
    direction: -1 | 1
) => {
    const currentIndex = items.findIndex(item => item.id === itemId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
        return items;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(currentIndex, 1);
    nextItems.splice(nextIndex, 0, item);

    return nextItems;
};

export const getDashboardItemsOrder = (items: DashboardItem[]) =>
    items.map((item, index) => ({
        itemId: item.id,
        posY: index,
    }));
