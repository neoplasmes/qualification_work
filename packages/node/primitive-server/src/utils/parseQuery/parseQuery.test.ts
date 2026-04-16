import { describe, expect, it } from 'vitest';

import { parseQuery } from './parseQuery';

describe('parseQuery', () => {
    it('один параметр', () => {
        expect(parseQuery('a=1')).toEqual({ a: '1' });
    });

    it('несколько параметров', () => {
        expect(parseQuery('a=1&b=2&c=3')).toEqual({ a: '1', b: '2', c: '3' });
    });

    it('пустая строка - пустой объект', () => {
        expect(parseQuery('')).toEqual({});
    });

    it('ключ без значения - пустая строка', () => {
        expect(parseQuery('foo')).toEqual({ foo: '' });
    });

    it('ключ с пустым значением - пустая строка', () => {
        expect(parseQuery('foo=')).toEqual({ foo: '' });
    });

    it('собирает в массив дубликаты ключей', () => {
        expect(parseQuery('a=1&a=2')).toEqual({ a: ['1', '2'] });
    });

    it('три одинаковых ключа - массив из трёх', () => {
        expect(parseQuery('a=1&a=2&a=3')).toEqual({ a: ['1', '2', '3'] });
    });

    it('знак = в значении не ломает парсинг', () => {
        expect(parseQuery('expr=1=2')).toEqual({ expr: '1=2' });
    });

    it('пропускает пустые сегменты между &&', () => {
        expect(parseQuery('a=1&&b=2')).toEqual({ a: '1', b: '2' });
    });

    it('амперсанд в конце', () => {
        expect(parseQuery('a=1&')).toEqual({ a: '1' });
    });

    it('амперсанд в начале', () => {
        expect(parseQuery('&a=1')).toEqual({ a: '1' });
    });

    it('кидает ошибку на процент', () => {
        expect(() => parseQuery('a=%20')).toThrow();
    });

    it('кидает ошибку на плюс', () => {
        expect(() => parseQuery('a=hello+world')).toThrow();
    });
});
