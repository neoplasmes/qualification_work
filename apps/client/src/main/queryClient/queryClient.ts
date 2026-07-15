import { readFreshness, retryRead } from '@/env/cache/freshness';
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { ...readFreshness, retry: retryRead },
            mutations: { retry: false },
        },
    });
}
