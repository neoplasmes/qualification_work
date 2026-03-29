import { AppError } from './app.error';

/**
 * типичный Bad Request, но удобно отлавливаемый в коде
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        // TODO: понять надо ли это вообще
        public readonly details: Record<string, string[]>
    ) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}
