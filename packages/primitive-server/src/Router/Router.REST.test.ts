import { describe, expect, it } from 'vitest';

import { Router } from './Router';

const noop = Array.from({ length: 10 }, () => () => {});

describe('Router REST API orchestration', () => {
    it('accepts different methods on the root router prefix', () => {
        const router = new Router('/posts');

        router.get('/', noop[0]);
        router.post('/', noop[1]);
        router.get('/:id', noop[2]);
        router.put('/:id', noop[3]);
        router.delete('/:id', noop[4]);

        const postsNode = router.root;
        const postsIdNode = postsNode.getChild(':id')!;

        expect(postsNode.getHandler('GET')).toEqual(noop[0]);
        expect(postsNode.getHandler('POST')).toEqual(noop[1]);

        expect(postsIdNode.getHandler('GET')).toEqual(noop[2]);
        expect(postsIdNode.getHandler('PUT')).toEqual(noop[3]);
        expect(postsIdNode.getHandler('DELETE')).toEqual(noop[4]);
    });

    it('treats empty string and slash as the same root path under router prefix', () => {
        const router = new Router('/datasets');

        router.get('', noop[0]);
        router.post('/', noop[1]);

        const datasetsNode = router.root;

        expect(datasetsNode.getHandler('GET')).toEqual(noop[0]);
        expect(datasetsNode.getHandler('POST')).toEqual(noop[1]);
    });

    it('supports REST-style nested resources on shared path prefixes', () => {
        const router = new Router('/posts');

        router.get('/', noop[0]);
        router.post('/', noop[1]);
        router.get('/:id', noop[2]);
        router.patch('/:id', noop[3]);
        router.get('/:id/comments', noop[4]);
        router.post('/:id/comments', noop[5]);
        router.get('/:id/comments/:commentId', noop[6]);
        router.delete('/:id/comments/:commentId', noop[7]);

        const postIdNode = router.root.getChild(':id')!;
        const commentsNode = postIdNode.getChild('comments')!;
        const commentIdNode = commentsNode.getChild(':commentId')!;

        expect(postIdNode.getHandler('GET')).toEqual(noop[2]);
        expect(postIdNode.getHandler('PATCH')).toEqual(noop[3]);

        expect(commentsNode.getHandler('GET')).toEqual(noop[4]);
        expect(commentsNode.getHandler('POST')).toEqual(noop[5]);

        expect(commentIdNode.getHandler('GET')).toEqual(noop[6]);
        expect(commentIdNode.getHandler('DELETE')).toEqual(noop[7]);
    });

    it('matches root and nested REST handlers through lookup after compile', () => {
        const router = new Router('/posts');

        router.get('/', noop[0]);
        router.post('/', noop[1]);
        router.get('/:id', noop[2]);
        router.delete('/:id', noop[3]);
        router.get('/:id/comments', noop[4]);

        router.compile();

        const rootLookup = router.lookup('/');
        expect(rootLookup.found).toBe(true);
        expect(rootLookup.handlers?.GET).toBeTypeOf('function');
        expect(rootLookup.handlers?.POST).toBeTypeOf('function');
        expect(rootLookup.handlers?.DELETE).toBeNull();

        const rootTrailingSlashLookup = router.lookup('');
        expect(rootTrailingSlashLookup.found).toBe(true);
        expect(rootTrailingSlashLookup.handlers?.GET).toBeTypeOf('function');
        expect(rootTrailingSlashLookup.handlers?.POST).toBeTypeOf('function');
        expect(rootTrailingSlashLookup.handlers?.DELETE).toBeNull();

        const postLookup = router.lookup('/42');
        expect(postLookup.found).toBe(true);
        expect(postLookup.params).toMatchObject({ id: '42' });
        expect(postLookup.handlers?.GET).toBeTypeOf('function');
        expect(postLookup.handlers?.DELETE).toBeTypeOf('function');
        expect(postLookup.handlers?.POST).toBeNull();

        const commentsLookup = router.lookup('/42/comments');
        expect(commentsLookup.found).toBe(true);
        expect(commentsLookup.params).toMatchObject({ id: '42' });
        expect(commentsLookup.handlers?.GET).toBeTypeOf('function');
        expect(commentsLookup.handlers?.POST).toBeNull();
    });

    it('keeps unrelated methods empty on the same REST node', () => {
        const router = new Router('/posts');

        router.get('/:id', noop[0]);
        router.delete('/:id', noop[1]);

        const postIdNode = router.root.getChild(':id')!;

        expect(postIdNode.getHandler('GET')).toEqual(noop[0]);
        expect(postIdNode.getHandler('DELETE')).toEqual(noop[1]);
        expect(postIdNode.getHandler('POST')).toBeNull();
        expect(postIdNode.getHandler('PATCH')).toBeNull();
    });
});
