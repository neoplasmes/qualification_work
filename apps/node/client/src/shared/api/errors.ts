type ApiErrorShape = {
    status?: unknown;
    data?: unknown;
    error?: unknown;
};

const hasStringProp = <K extends string>(
    value: unknown,
    key: K
): value is Record<K, string> =>
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    typeof (value as Record<K, unknown>)[key] === 'string';

export const getApiErrorMessage = (
    error: unknown,
    fallback = 'Request failed. Please try again.'
): string => {
    const apiError = error as ApiErrorShape;

    if (hasStringProp(apiError.data, 'error')) {
        return apiError.data.error;
    }

    if (hasStringProp(apiError.data, 'message')) {
        return apiError.data.message;
    }

    if (typeof apiError.error === 'string') {
        return apiError.error;
    }

    if (apiError.status === 401) {
        return 'Invalid email or password.';
    }

    if (apiError.status === 409) {
        return 'An account with this email already exists.';
    }

    return fallback;
};
