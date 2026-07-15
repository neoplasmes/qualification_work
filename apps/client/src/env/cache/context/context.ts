import { createContext } from 'react';

import type { CacheRuntime } from '../runtime';

export const cacheContext = createContext<CacheRuntime | null>(null);
