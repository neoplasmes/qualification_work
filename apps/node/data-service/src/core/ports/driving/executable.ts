/**
 * Common driving port for all read/write operations in application.
 * All read/write ops MUST implement this method
 *
 * @export
 * @interface Executable
 * @template {Record<string, unknown>} I
 * @template {Record<string, unknown> | void} [O=void]
 */
export interface Executable<
    I extends Record<string, unknown>,
    O extends Record<string, unknown> | void = void,
> {
    execute(input: I): O;
}
