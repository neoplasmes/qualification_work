export const getSelected = <T extends { id: string }>(
    items: T[] | undefined,
    selectedId: string | null
): T | undefined => {
    if (!items || items.length === 0) {
        return undefined;
    }

    return items.find(item => item.id === selectedId) ?? items[0];
};
