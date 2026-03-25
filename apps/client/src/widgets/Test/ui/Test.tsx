import { lazy, Suspense, useState } from 'react';
import { Await, useLoaderData } from 'react-router';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

const LazyTest = lazy(() => import('./Test2'));

export const Test = () => {
    const [state, setState] = useState(1);

    const { testData } = useLoaderData<{ testData: Promise<string> }>();

    return (
        <div>
            <Suspense fallback={<div>Загрузка...</div>}>
                <Await resolve={testData}>
                    {data => (
                        <div>
                            <span>{data}</span>
                            <button onClick={() => setState(prev => prev + 1)}>
                                Click
                            </button>
                            <span>{state}</span>
                        </div>
                    )}
                </Await>
            </Suspense>
            <ClientOnlyDeffered
                fallback={<div>Загрузка графиков</div>}
                LazyComponent={LazyTest}
            />
        </div>
    );
};
