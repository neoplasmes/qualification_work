import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRafThrottle } from './useRafThrottle';

const RafProbe = ({ onSchedule }: { onSchedule: () => void }) => {
    const throttled = useRafThrottle(onSchedule);

    useEffect(() => {
        throttled();
    }, [throttled]);

    return null;
};

describe('useRafThrottle', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 1)
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('cancels a pending animation frame on unmount', () => {
        const { unmount } = render(<RafProbe onSchedule={vi.fn()} />);

        unmount();

        expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    });
});
