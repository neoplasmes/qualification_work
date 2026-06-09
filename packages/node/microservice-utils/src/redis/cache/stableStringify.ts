/**
 * A function, used for generating stable JSON strings for different types of data.
 * special case there is object's processing:
 * { b: 2, a: 1 }
 * and
 * { a: 1, b: 2 }
 *
 * will be turned into an equal strings. nested values are treated the same way
 *
 * this function used for generating cache keys to store in redis
 * from the params with which wrapped function has been called
 *
 * @export
 * @param value
 * @returns
 */
export function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    if (value instanceof Date) {
        return JSON.stringify(value.toISOString());
    }

    // ————————————————————— Object stabilization —————————————————————

    const sortedEntries = Object.entries(value as Record<string, unknown>).sort(
        ([a], [b]) => a.localeCompare(b)
    );
    const stableEntries = sortedEntries.map(
        ([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`
    );

    return `{${stableEntries.join(',')}}`;
}
