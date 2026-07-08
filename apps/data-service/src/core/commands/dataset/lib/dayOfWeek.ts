const dayAliases = new Map<string, number>([
    ['monday', 1],
    ['mon', 1],
    ['понедельник', 1],
    ['пн', 1],
    ['tuesday', 2],
    ['tue', 2],
    ['tues', 2],
    ['вторник', 2],
    ['вт', 2],
    ['wednesday', 3],
    ['wed', 3],
    ['среда', 3],
    ['ср', 3],
    ['thursday', 4],
    ['thu', 4],
    ['thur', 4],
    ['thurs', 4],
    ['четверг', 4],
    ['чт', 4],
    ['friday', 5],
    ['fri', 5],
    ['пятница', 5],
    ['пт', 5],
    ['saturday', 6],
    ['sat', 6],
    ['суббота', 6],
    ['сб', 6],
    ['sunday', 7],
    ['sun', 7],
    ['воскресенье', 7],
    ['вс', 7],
]);

export function normalizeDayOfWeekLabel(value: string): string {
    return value.trim().toLowerCase().replace(/\.$/, '');
}

export function getDayOfWeekOrder(value: unknown): number | null {
    if (typeof value !== 'string') {
        return null;
    }

    return dayAliases.get(normalizeDayOfWeekLabel(value)) ?? null;
}

export function isDayOfWeekValue(value: unknown): boolean {
    return getDayOfWeekOrder(value) !== null;
}
