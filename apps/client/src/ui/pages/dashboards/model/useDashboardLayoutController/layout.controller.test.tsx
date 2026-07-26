import { useDashboardLayoutController } from '.';
import { deferred } from '@/test/readFixtures';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ executeOutcome: vi.fn(), read: vi.fn() }));
vi.mock('@/env/cache/useCommand', () => ({
    useCommand: () => ({ executeOutcome: mocks.executeOutcome, isPending: false }),
}));
vi.mock('@/ui/di/dependencies', () => ({
    useDependencies: () => ({
        updateDashboardLayout: {},
        getDashboard: {},
        cache: { read: mocks.read },
    }),
}));
const first = [{ itemId: 'i', posX: 0, posY: 0, width: 3, height: 2 }];
const second = [{ ...first[0]!, posX: 3 }];
beforeEach(() => {
    vi.resetAllMocks();
});

it('retains a failed layout and retries its complete snapshot', async () => {
    mocks.executeOutcome
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() =>
        useDashboardLayoutController({ orgId: 'o', dashboardId: 'd' })
    );
    await act(() => result.current.save(first));
    expect(result.current.layout).toEqual(first);
    expect(result.current.error).toContain('Черновик');
    await act(() => result.current.retry());
    expect(mocks.executeOutcome).toHaveBeenLastCalledWith({
        orgId: 'o',
        dashboardId: 'd',
        layout: first,
    });
    expect(result.current.layout).toBeUndefined();
});
it('keeps a newer drag when an older save finishes', async () => {
    const old = deferred<{ data: undefined }>();
    const recent = deferred<{ data: undefined }>();
    mocks.executeOutcome
        .mockReturnValueOnce(old.promise)
        .mockReturnValueOnce(recent.promise);
    const { result } = renderHook(() =>
        useDashboardLayoutController({ orgId: 'o', dashboardId: 'd' })
    );
    let oldSave: Promise<void>;
    let newSave: Promise<void>;
    act(() => {
        oldSave = result.current.save(first);
    });
    act(() => {
        newSave = result.current.save(second);
    });
    await act(async () => {
        old.resolve({ data: undefined });
        await oldSave;
    });
    expect(result.current.layout).toEqual(second);
    await act(async () => {
        recent.resolve({ data: undefined });
        await newSave;
    });
    expect(result.current.layout).toBeUndefined();
});
it('refreshes a confirmed write without resending it', async () => {
    mocks.executeOutcome.mockResolvedValue({
        data: undefined,
        syncError: new Error('read failed'),
    });
    mocks.read.mockResolvedValue({});
    const { result } = renderHook(() =>
        useDashboardLayoutController({ orgId: 'o', dashboardId: 'd' })
    );
    await act(() => result.current.save(first));
    expect(result.current.error).toContain('сохранено');
    await act(() => result.current.retry());
    expect(mocks.executeOutcome).toHaveBeenCalledTimes(1);
    expect(mocks.read).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.layout).toBeUndefined());
});
it.each([
    ['same', 'resolve'],
    ['same', 'reject'],
    ['different', 'resolve'],
    ['different', 'reject'],
])(
    'fences an old refresh after a %s dashboard draft and %s',
    async (scope, completion) => {
        const refresh = deferred<unknown>();
        mocks.executeOutcome
            .mockResolvedValueOnce({
                data: undefined,
                syncError: new Error('refresh failed'),
            })
            .mockRejectedValueOnce(new Error('new write failed'));
        mocks.read.mockReturnValueOnce(refresh.promise);
        const { result, rerender } = renderHook(
            ({ dashboardId }) =>
                useDashboardLayoutController({ orgId: 'o', dashboardId }),
            { initialProps: { dashboardId: 'd' } }
        );
        await act(() => result.current.save(first));
        let retry: Promise<void>;
        act(() => {
            retry = result.current.retry();
        });
        if (scope === 'different') {
            rerender({ dashboardId: 'other' });
        }
        await act(() => result.current.save(second));
        const newError = result.current.error;
        await act(async () => {
            if (completion === 'resolve') {
                refresh.resolve({});
            } else {
                refresh.reject(new Error('old refresh failed'));
            }
            await retry;
        });
        expect(result.current.layout).toEqual(second);
        expect(result.current.error).toBe(newError);
    }
);
