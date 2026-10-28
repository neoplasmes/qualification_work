// runtime guards for untrusted provider json

export type JsonRecord = Record<string, unknown>;

/**
 * checks that a value is a plain json object
 *
 * @param value
 * @returns
 */
export const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * reads a string field or undefined
 *
 * @param record
 * @param key
 * @returns
 */
export const readString = (record: JsonRecord, key: string): string | undefined => {
    const value = record[key];

    return typeof value === 'string' ? value : undefined;
};

/**
 * reads a nested object field or undefined
 *
 * @param record
 * @param key
 * @returns
 */
export const readRecord = (record: JsonRecord, key: string): JsonRecord | undefined => {
    const value = record[key];

    return isRecord(value) ? value : undefined;
};
