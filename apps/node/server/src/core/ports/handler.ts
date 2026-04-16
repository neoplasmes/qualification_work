/**
 * Common interface for all handlers in the application.
 * A handler is responsible for executing a specific use case or business logic.
 *
 * @export
 * @interface Handler
 * @template I
 * @template [O=void]
 */
export interface Handler<I, O = void> {
    execute(input: I): Promise<O>;
}
