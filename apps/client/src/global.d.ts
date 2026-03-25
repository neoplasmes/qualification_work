import type { RootState } from './app/model';

declare global {
    interface Window {
        /**
         * redux ssr preloaded state должен быть прислан инлайн скриптом в начале стрима
         */
        __PRELOADED_STATE__?: RootState;

        /**
         * ReadableStream<string> с turbo-stream чанками,
         * наполняется инкрементально через <script> теги по мере стрима
         */
        __TURBO_STREAM__?: ReadableStream<string>;

        /**
         * контроллер для __TURBO_STREAM__ — сервер пушит чанки через enqueue, закрывает через close
         */
        __TURBO_CTRL__?: {
            enqueue(chunk: string): void;
            close(): void;
        };
    }
}

export {};
