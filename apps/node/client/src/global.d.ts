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
    type Display =
        | 'block'
        | 'inline'
        | 'inline-block'
        | 'inline-flex'
        | 'flex'
        | 'grid'
        | 'none';
    type Justify = 'start' | 'center' | 'end' | 'between';
    type Align = 'start' | 'center' | 'end' | 'stretch';
    type Wrap = 'wrap' | 'nowrap';
    type Padding = 'none' | Spacing;
}

declare module 'react' {
    interface HTMLAttributes<T> {
        'data-stack'?: 'h' | 'v';
        'data-gap'?: Spacing;
        'data-p'?: Padding;
        'data-px'?: Padding;
        'data-py'?: Padding;
        'data-pt'?: Padding;
        'data-pr'?: Padding;
        'data-pb'?: Padding;
        'data-pl'?: Padding;
        'data-justify'?: Justify;
        'data-align'?: Align;
        'data-wrap'?: Wrap;
        'data-grow'?: boolean | '';
        'data-flex'?: boolean | '';
        'data-display'?: Display;
    }
}
