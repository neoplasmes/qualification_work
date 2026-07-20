import { createContext } from 'react';

import type { createChartsPageStore } from '../pageState';

export const chartsEditorContext = createContext<ReturnType<
    typeof createChartsPageStore
> | null>(null);
