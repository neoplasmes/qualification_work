import { describe, it, expect } from 'vitest';

import { PathSegment } from './PathSegment';

import { SegmentMap } from './SegmentMap';

// мок-сегмент - просто объект с нужным полем, чтобы отличать
const seg = (name: string) => new PathSegment(name);

describe('SegmentMap', () => {
    describe('set + getByRange', () => {
        it('находит то, что положили', () => {
            const map = new SegmentMap();
            const s = seg('users');
            map.set('users', s);

            expect(map.getByRange('users', 0, 5)).toBe(s);
        });

        it('null если ключа нет', () => {
            const map = new SegmentMap();
            expect(map.getByRange('nope', 0, 4)).toBeNull();
        });

        it('перезаписывает значение при повторном set', () => {
            const map = new SegmentMap();
            map.set('key', seg('old'));
            const newSeg = seg('new');
            map.set('key', newSeg);

            expect(map.getByRange('key', 0, 3)).toBe(newSeg);
        });

        it('хранит несколько разных ключей', () => {
            const map = new SegmentMap();
            const a = seg('a');
            const b = seg('b');
            map.set('users', a);
            map.set('posts', b);

            expect(map.getByRange('users', 0, 5)).toBe(a);
            expect(map.getByRange('posts', 0, 5)).toBe(b);
        });
    });

    describe('getByRange - работа с подстрокой', () => {
        it('ищет по диапазону внутри строки', () => {
            const map = new SegmentMap();
            const s = seg('api');
            map.set('api', s);

            // "/api/users" - ищем "api" с позиции 1 до 4
            expect(map.getByRange('/api/users', 1, 4)).toBe(s);
        });

        it('ищет сегмент в середине пути', () => {
            const map = new SegmentMap();
            const s = seg('users');
            map.set('users', s);

            // "/api/users/123" - "users" с 5 по 10
            expect(map.getByRange('/api/users/123', 5, 10)).toBe(s);
        });

        it('null если длина совпадает но символы нет', () => {
            const map = new SegmentMap();
            map.set('abc', seg('abc'));

            // "xyz" - та же длина, другие символы
            expect(map.getByRange('xyz', 0, 3)).toBeNull();
        });
    });

    describe('capacity', () => {
        it('работает с маленькой capacity', () => {
            const map = new SegmentMap(2);
            const s = seg('x');
            map.set('hello', s);

            expect(map.getByRange('hello', 0, 5)).toBe(s);
        });

        it('работает с кучей элементов', () => {
            const map = new SegmentMap(4);
            const segments: Array<{ key: string; value: PathSegment }> = [];

            for (let i = 0; i < 100; i++) {
                const key = `segment${i}`;
                const value = seg(key);
                segments.push({ key, value });
                map.set(key, value);
            }

            // все на месте
            for (const { key, value } of segments) {
                expect(map.getByRange(key, 0, key.length)).toBe(value);
            }
        });
    });
});
