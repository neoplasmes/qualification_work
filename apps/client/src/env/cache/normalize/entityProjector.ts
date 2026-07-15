export class EntityProjector<O> {
    private readonly snapshots = new WeakMap<
        object,
        { children: readonly unknown[]; value: O }
    >();

    resolve(row: object, children: readonly unknown[], project: () => O): O {
        const previous = this.snapshots.get(row);
        if (
            previous &&
            previous.children.length === children.length &&
            previous.children.every((child, index) => child === children[index])
        ) {
            return previous.value;
        }
        const value = project();
        this.snapshots.set(row, { children: [...children], value });

        return value;
    }
}
