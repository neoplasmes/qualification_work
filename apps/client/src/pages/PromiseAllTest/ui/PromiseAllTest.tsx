import { Suspense } from 'react';
import { Await, useLoaderData } from 'react-router';

import { useGetCommentsQuery, useGetPostQuery, useGetUserQuery } from '@/shared/api/api';

export const PromiseAllTest = () => {
    const { combined } = useLoaderData<{ combined: Promise<unknown[]> }>();

    return (
        <div>
            <h2>Promise.all test</h2>

            <Suspense fallback={<div>lading...</div>}>
                <Await resolve={combined}>
                    {data => (
                        <div style={{ marginBottom: 16 }}>
                            <strong>Loader data:</strong>
                            <pre
                                style={{ fontSize: 12, maxHeight: 200, overflow: 'auto' }}
                            >
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    )}
                </Await>
            </Suspense>

            <hr />

            <PostFromCache />
            <UserFromCache />
            <CommentsFromCache />
        </div>
    );
};

function PostFromCache() {
    const { data, isLoading, isFetching } = useGetPostQuery(2);

    return (
        <div>
            <strong>getPost(2):</strong> {isLoading ? 'loading...' : data?.title}
            {isFetching && !isLoading && ' (refetching!)'}
        </div>
    );
}

function UserFromCache() {
    const { data, isLoading, isFetching } = useGetUserQuery(1);

    return (
        <div>
            <strong>getUser(1):</strong>{' '}
            {isLoading ? 'loading...' : `${data?.name} (${data?.email})`}
            {isFetching && !isLoading && ' (refetching!)'}
        </div>
    );
}

function CommentsFromCache() {
    const { data, isLoading, isFetching } = useGetCommentsQuery(2);

    return (
        <div>
            <strong>getComments(2):</strong>{' '}
            {isLoading ? 'loading...' : `${data?.length} comments`}
            {isFetching && !isLoading && ' (refetching!)'}
        </div>
    );
}
