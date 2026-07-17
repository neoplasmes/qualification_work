export class NetworkError extends Error {
    constructor(message = 'Network request failed', options?: ErrorOptions) {
        super(message, options);
        this.name = 'NetworkError';
    }
}

export class HttpError extends Error {
    constructor(
        readonly status: number,
        readonly payload?: unknown
    ) {
        super(`HTTP ${status}`);
        this.name = 'HttpError';
    }
}

export class ContractViolationError extends Error {
    constructor(message = 'Invalid response data', options?: ErrorOptions) {
        super(message, options);
        this.name = 'ContractViolationError';
    }
}
