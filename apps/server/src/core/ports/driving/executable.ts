/**
 * Common driving port for all read/write operations in application.
 * All read/write ops MUST implement this method
 *
 * @export
 * @interface Executable
 * @template {unknown[]} I
 * @template {unknown} O
 */
export interface Executable<I extends unknown[], O extends unknown> {
    execute(...args: I): O;
}

/**
 * Typescript utility to extract input and output types from handlers
 *
 * @export
 * @template T
 */
export type ExecutableIO<T> =
    T extends Executable<infer I, infer O> ? { I: I; O: O } : never;
