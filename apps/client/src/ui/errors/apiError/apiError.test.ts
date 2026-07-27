import { HttpError } from '@/env/transport/http';
import { expect, it } from 'vitest';

import { SessionError } from '@/app/ports/repos/session';

import { getApiErrorMessage } from './apiError';

it('preserves server and domain messages with safe empty fallbacks', () => {
    expect(getApiErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(new Error('failed'), 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(new HttpError(400, { error: 'Invalid field' }))).toBe(
        'Invalid field'
    );
    expect(getApiErrorMessage(new HttpError(400, { message: 'Invalid value' }))).toBe(
        'Invalid value'
    );
    expect(
        getApiErrorMessage(new SessionError('emailInUse', 409, 'Email already used'))
    ).toBe('Email already used');
    expect(getApiErrorMessage({ data: { error: 'Existing error' } })).toBe(
        'Existing error'
    );
    expect(getApiErrorMessage(new HttpError(401))).toBe('Неверная почта или пароль.');
    expect(getApiErrorMessage(new HttpError(503), 'fallback')).toBe('fallback');
});
