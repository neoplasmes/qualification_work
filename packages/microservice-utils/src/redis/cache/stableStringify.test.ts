import { describe, expect, it } from 'vitest';

import { stableStringify } from './stableStringify.ts';

describe('stableStringify', () => {
    it('sorts object keys recursively', () => {
        expect(
            stableStringify({
                b: 2,
                nested: { d: 4, c: 3 },
                a: 1,
            })
        ).toBe('{"a":1,"b":2,"nested":{"c":3,"d":4}}');
    });

    it('keeps array item order', () => {
        expect(stableStringify(['dashboards', { b: 2, a: 1 }])).toBe(
            '["dashboards",{"a":1,"b":2}]'
        );
    });

    it('serializes dates as json strings', () => {
        expect(stableStringify(new Date('2026-06-09T10:15:30.000Z'))).toBe(
            '"2026-06-09T10:15:30.000Z"'
        );
    });
});
