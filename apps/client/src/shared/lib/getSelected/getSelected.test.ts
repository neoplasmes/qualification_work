import { describe, expect, it } from 'vitest';

import { getSelected } from './getSelected';

describe('getSelected', () => {
    it('selects by id with default item shape', () => {
        expect(getSelected([{ id: 'a' }, { id: 'b' }], 'b')).toEqual({ id: 'b' });
    });

    it('selects by custom id getter and falls back to first item', () => {
        const items = [
            { dataset: { id: 'dataset-1' } },
            { dataset: { id: 'dataset-2' } },
        ];

        expect(getSelected(items, 'missing', item => item.dataset.id)).toBe(items[0]);
        expect(getSelected(items, 'dataset-2', item => item.dataset.id)).toBe(items[1]);
    });
});
