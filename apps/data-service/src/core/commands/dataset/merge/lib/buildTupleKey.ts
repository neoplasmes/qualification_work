/**
 * builds a unique string key for compound merge keys. JSON.stringify keeps types
 * separate so 1 and "1" do not collide
 *
 * @param row
 * @param mergeKeys
 * @returns
 */
export function buildTupleKey(row: Record<string, unknown>, mergeKeys: string[]): string {
    const parts: string[] = [];
    for (const key of mergeKeys) {
        const v = row[key];
        parts.push(JSON.stringify(v ?? null));
    }

    return parts.join('\x01');
}
