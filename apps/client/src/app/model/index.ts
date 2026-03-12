export interface AppState {
    isReady: boolean;
    locale: string;
}

export function getInitialAppState(): AppState {
    return {
        isReady: false,
        locale: 'en',
    };
}
