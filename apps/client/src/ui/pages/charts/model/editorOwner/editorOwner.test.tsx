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

it.each(['organization', 'session'])(
    'retires pending create ownership after %s changes',
    async scope => {
        const { runtime } = createUiTestRuntime();
        const wrapper = ({ children }: PropsWithChildren) => (
            <ClientRoot runtime={runtime}>
                <MemoryRouter>
                    <ChartsEditorProvider>{children}</ChartsEditorProvider>
                </MemoryRouter>
            </ClientRoot>
        );
        const { result } = renderHook(
            () => ({
                actions: useChartsPageActions(),
                save: useChartsPageState(state => state.createSave),
                draft: useChartsPageState(state => state.createDraft),
            }),
            { wrapper }
        );
        let token!: object;
        act(() => {
            result.current.actions.setChartCreateDraft({
                datasetId: 'old',
                draft: createChartBuilderDraft(),
                output: null,
            });
            token = result.current.actions.beginCreateSave('old-org')!;
        });
        await act(async () => {
            if (scope === 'organization') {
                runtime.dependencies.ui.activeOrganization
                    .getState()
                    .setActiveOrgId('new-org');
            } else {
                await runtime.dependencies.session.reset();
            }
        });
        expect(result.current.save).toBeNull();
        expect(result.current.draft).toBeNull();
        expect(result.current.actions.acknowledgeCreate(token, 'old-chart')).toBe(false);
    }
);
