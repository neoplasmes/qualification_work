import { AppError } from './app.error';

/**
 * Кидать при конфликтах с UNIQUE полями и проч.
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
        this.name = 'ConflictError';
    }
}
