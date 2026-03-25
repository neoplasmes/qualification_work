import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router';
import { decode } from 'turbo-stream';

import { createStore, getRoutes } from '@/app/model';

const node = document.getElementById('root');

if (!node) {
    throw new Error('FATAL ERROR: ROOT ELEMENT HAS NOT BEEN FOUND');
}

const store = createStore(window.__PRELOADED_STATE__);

/**
 * Когда мы дождёмся await, здесь сразу будут сериализованы все промисы, и они восстановятся там, где нужно
 * что позволит использовать <Await /> из react-router вместе с loader'ами.
 */
const hydrationData = window.__TURBO_STREAM__
    ? ((await decode(window.__TURBO_STREAM__)) as HydrationState)
    : undefined;

// const logs = setInterval(() => {
//     console.log(hydrationData?.loaderData['0-0']);
// }, 1000);

// setTimeout(() => clearInterval(logs), 8000);

const router = createBrowserRouter(getRoutes(store), {
    hydrationData,
});

const _root = hydrateRoot(
    node,
    <Provider store={store}>
        <RouterProvider router={router} />
    </Provider>
);
