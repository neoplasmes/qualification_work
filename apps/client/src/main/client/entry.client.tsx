import { hydrateAppSnapshot, observeDeferredReads } from '@/env/cache/hydration';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, type HydrationState } from 'react-router';
import { decode } from 'turbo-stream';

import { ClientRoot } from '../ClientRoot';
import { createDependencies } from '../dependencies';
import { getRoutes } from '../router';

import '@qualification-work/design-system/theme.css';
import '../../shared/ui/styles/colors.scss';
import '../../shared/ui/styles/layout.scss';
import '../../shared/ui/styles/fonts.scss';
import './global.scss';

const node = document.getElementById('root');
if (!node) {
    throw new Error('FATAL ERROR: ROOT ELEMENT HAS NOT BEEN FOUND');
}

const runtime = createDependencies({
    platform: 'browser',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
});
const initial = window.__APP_SNAPSHOT__;
if (initial) {
    runtime.acceptScope(initial.scopeId);
    await hydrateAppSnapshot(runtime.cache, initial, () => runtime.scopeId);
    delete window.__APP_SNAPSHOT__;
}

/**
 * Изначально здесь сразу будет сериализовано дерево промисов с сервера, не разрешённые сериализованы как $<number>.
 * (в результате encode)
 * После decode отложенные промисы turbo-stream превратит в объекты типа Deferred (внутренний его класс),
 * он будет иметь к ним доступ по ссылке, т.к. сохранит у себя в памяти.
 * Когда приходит новый чанк и мы вызваем enqueue, turbo-stream это видит, т.к. readable stream он тоже сохраняет
 * у себя по ссылке в памяти. Он смотрит id чанка, смотрит данные, с которыми нужно вызвать resolve() своего
 * Deffered объекта, и всё по кайфу делает
 */
const hydrationData = window.__TURBO_STREAM__
    ? ((await decode(window.__TURBO_STREAM__)) as HydrationState)
    : undefined;

/**
 * Данная конструкция работает потому, что после await decode(window.__TURBO_STREAM__),
 * мы уже получаем все деревья с промисами и их pending состояниями (спасибо turbo-stream).
 * Соответственно, мы просто берём и обвешиваем все промисы then колбэками, которые гидрируют кэш сущностей и запросов
 *
 * Promise.all - разрешаем
 * вложенные промисы сохраняют обработку ошибок
 */
/**
 * loaderData: {
 *  'routeID-routeID': {
 *      key: value
 *  }
 * }
 */
// Попался массив результатов - значит пришёл результат Promise.all
// Обработка непосредственно результатов выполнения cache read, всё остальное скипнется
await observeDeferredReads(
    hydrationData?.loaderData,
    runtime.cache,
    () => runtime.scopeId,
    error => console.error('Deferred loader failed', error)
);

const router = createBrowserRouter(getRoutes(runtime), { hydrationData });
runtime.dependencies.session.setNavigator(path => {
    void router.navigate(path, { replace: true });
});
const root = hydrateRoot(node, <ClientRoot runtime={runtime} router={router} />);

const dispose = () => {
    window.removeEventListener('pagehide', onPageHide);
    router.dispose();
    root.unmount();
    void runtime
        .dispose()
        .catch(error => console.error('Runtime disposal failed', error));
};
const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
        dispose();
    }
};
window.addEventListener('pagehide', onPageHide);
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        dispose();
    });
}
