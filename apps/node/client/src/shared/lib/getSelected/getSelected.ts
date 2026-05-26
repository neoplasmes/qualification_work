export const getSelected = <T>(
    items: T[] | undefined,
    selectedId: string | null,
    getId: (item: T) => string = item => (item as { id: string }).id
): T | undefined => {
    if (!items || items.length === 0) {
        return undefined;
    }

    return items.find(item => getId(item) === selectedId) ?? items[0];
};
