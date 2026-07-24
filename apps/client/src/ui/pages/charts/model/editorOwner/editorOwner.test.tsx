import { ClientRoot } from '@/main/ClientRoot';
import { createUiTestRuntime } from '@/test/uiRuntime';
import { createChartBuilderDraft } from '@/ui/pages/charts/ui/ChartBuilder';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';
import { expect, it } from 'vitest';

import { useChartsPageActions, useChartsPageState } from '../usePageState';
import { ChartsEditorProvider } from './ChartsEditorProvider';

it('isolates mounted editors and keeps drafts across workspace navigation', () => {
    const { runtime } = createUiTestRuntime();
    const wrapper = ({ children }: PropsWithChildren) => (
        <ClientRoot runtime={runtime}>
            <MemoryRouter initialEntries={['/charts/edit?id=one']}>
                <ChartsEditorProvider>{children}</ChartsEditorProvider>
            </MemoryRouter>
        </ClientRoot>
    );
    const first = renderHook(
        () => ({
            actions: useChartsPageActions(),
            draft: useChartsPageState(state => state.editDraft),
            navigate: useNavigate(),
        }),
        { wrapper }
    );
    const second = renderHook(() => useChartsPageState(state => state.editDraft), {
        wrapper,
    });
    const initial = second.result.current;
    act(() =>
        first.result.current.actions.setChartEditDraft({
            chartId: 'one',
            draft: createChartBuilderDraft({ chartName: 'Dirty' }),
            output: null,
        })
    );
    expect(second.result.current).toEqual(initial);
    act(() => first.result.current.navigate('/datasets'));
    act(() => first.result.current.navigate('/charts/view?id=one'));
    act(() => first.result.current.navigate('/charts/edit?id=one'));
    expect(first.result.current.draft?.draft.chartName).toBe('Dirty');
    first.unmount();
    const remounted = renderHook(() => useChartsPageState(state => state.editDraft), {
        wrapper,
    });
    expect(remounted.result.current).toBeNull();
});
