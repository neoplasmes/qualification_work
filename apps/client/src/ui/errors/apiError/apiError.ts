import { OrganizationError } from '@/app/ports/repos/organization';
import { SessionError } from '@/app/ports/repos/session';

type ApiErrorShape = {
    status?: unknown;
    data?: unknown;
    error?: unknown;
    payload?: unknown;
    message?: unknown;
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
    fallback = 'Запрос не выполнен. Попробуйте ещё раз.'
): string => {
    if (typeof error !== 'object' || error === null) {
        return fallback;
    }
    const apiError = error as ApiErrorShape;
    const payload = apiError.payload ?? apiError.data;
    if (hasStringProp(payload, 'error')) {
        return payload.error;
    }
    if (hasStringProp(payload, 'message')) {
        return payload.message;
    }
    if (error instanceof SessionError || error instanceof OrganizationError) {
        return error.message;
    }

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
        return 'Неверная почта или пароль.';
    }

    if (apiError.status === 409) {
        return 'Аккаунт с такой почтой уже существует.';
    }

    return fallback;
};
