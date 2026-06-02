import { beforeEach, describe, expect, it } from 'vitest';

import {
    authenticatedSessionStorageKeys,
    clearAuthenticatedSessionStorage,
} from './sessionPersistence';

describe('sessionPersistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('clears user-scoped session storage and keeps global UI storage', () => {
        authenticatedSessionStorageKeys.forEach(key => {
            localStorage.setItem(key, JSON.stringify({ value: key }));
        });
        localStorage.setItem('qualification-work.active-org-id', 'org-1');
        localStorage.setItem('panelLayout_v2', JSON.stringify({ sizes: {} }));

        clearAuthenticatedSessionStorage();

        authenticatedSessionStorageKeys.forEach(key => {
            expect(localStorage.getItem(key)).toBeNull();
        });
        expect(localStorage.getItem('qualification-work.active-org-id')).toBeNull();
        expect(localStorage.getItem('panelLayout_v2')).toBe(
            JSON.stringify({ sizes: {} })
        );
    });
});
