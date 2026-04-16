import type { Plugin } from 'vite';

/**
 ** Проблема prod-режима
 * Vite генерирует <script type="module" crossorigin src="/assets/index-hash.js"></script>,
 * что по умолчанию получается свойство defered, из за чего сам скрипт выполняется только после события
 * DOMContentLoaded, то есть после окончания стрима.
 *
 * Это не подходит нам из-за необходимости partitial hydration прямо во время стриминга html-контента.
 * Из-за такой необходимости нужно, чтобы главный бандл можно было импортировать и начать экзекутить код сразу же как придёт Shell
 * из renderToPipableStream.
 *
 * Решение элементарное - добавить async к главному скрипту.
 *
 ** Проблема Dev-режима
 * <script type="module">
 *    import {injectIntoGlobalHook} from "/@react-refresh";
 *    injectIntoGlobalHook(window);
 *    window.$RefreshReg$ = () => {}
 *    window.$RefreshSig$ = () => (type) => type;
 * </script> - скрипт реактовского HMR, который приходит в dev-моде
 *
 * Опять type="module", опять выполнится только после DOMContentLoaded. Переписывать это полностью как-то неоч,
 * так что просто инжектим переменные заранее в head без type="module" и всё
 *
 * @see https://github.com/rakkasjs/rakkasjs/blob/ff95ee58ace4e262c320cc26884738ad0a74815c/packages/rakkasjs/src/features/pages/middleware.tsx#L740-L756
 * @see https://github.com/vitejs/vite-plugin-react/issues/222
 * @see https://github.com/vitejs/vite-plugin-react/issues/14
 * @see https://github.com/vitejs/vite/issues/3163
 */
export function entryScriptRewritePlugin(): Plugin[] {
    return [
        {
            name: 'entry-script-rewrite:dev',
            apply: 'serve',
            transformIndexHtml: {
                order: 'post',
                handler: html => ({
                    html,
                    tags: [
                        {
                            tag: 'script',
                            children: [
                                'window.$RefreshReg$ = () => {};',
                                'window.$RefreshSig$ = () => (type) => type;',
                            ].join('\n'),
                            injectTo: 'head-prepend',
                        },
                    ],
                }),
            },
        },
    ];
}
