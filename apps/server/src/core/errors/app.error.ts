/**
 * Базовый класс всех наших http ошибок
 */
export class AppError extends Error {
    constructor(
        message: string,
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
         */
        public readonly statusCode: number
    ) {
        super(message);
        this.name = 'AppError';
    }
}
