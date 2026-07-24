import { createContext } from 'react';

import type { createChartDraftStore } from '../chartDraft';

export const chartsEditorContext = createContext<ReturnType<
    typeof createChartDraftStore
> | null>(null);
