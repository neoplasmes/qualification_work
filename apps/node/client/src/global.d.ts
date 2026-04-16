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

    type Spacing =
        | 'xs'
        | 'sm'
        | 'sm-plus'
        | 'md'
        | 'md-plus'
        | 'lg'
        | 'lg-plus'
        | 'xl'
        | '2xl'
        | '3xl';
    type Display = 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none';
    type Justify = 'start' | 'center' | 'end' | 'between';
    type Align = 'start' | 'center' | 'end' | 'stretch';
    type Wrap = 'wrap' | 'nowrap';
}

declare module 'react' {
    interface HTMLAttributes<T> {
        'data-stack'?: 'h' | 'v';
        'data-gap'?: Spacing;
        'data-p'?: Spacing;
        'data-px'?: Spacing;
        'data-py'?: Spacing;
        'data-pt'?: Spacing;
        'data-pr'?: Spacing;
        'data-pb'?: Spacing;
        'data-pl'?: Spacing;
        'data-justify'?: Justify;
        'data-align'?: Align;
        'data-wrap'?: Wrap;
        'data-display'?: Display;
    }
}
