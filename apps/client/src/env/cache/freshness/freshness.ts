import { HttpError, NetworkError } from '@/env/transport/http';

export const readFreshness = { staleTime: 0, gcTime: 300_000 };
export const sessionFreshness = { staleTime: 30_000, gcTime: 300_000 };
export const metricPreviewFreshness = { staleTime: 0, gcTime: 30_000 };
export const collectionGraceTime = 30_000;

export function retryRead(count: number, error: unknown): boolean {
    return (
        count < 1 &&
        (error instanceof NetworkError ||
            (error instanceof HttpError && error.status >= 500 && error.status < 600))
    );
}
