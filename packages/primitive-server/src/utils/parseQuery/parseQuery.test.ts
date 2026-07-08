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

    it('декодирует percent-encoded значения', () => {
        expect(
            parseQuery(
                'name=%D0%9F%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%D0%B8%20%D0%B7%D0%B8%D0%BC%D0%B0'
            )
        ).toEqual({ name: 'Продажи зима' });
    });

    it('декодирует плюс как пробел', () => {
        expect(parseQuery('name=hello+world')).toEqual({ name: 'hello world' });
    });

    it('декодирует percent-encoded ключи', () => {
        expect(parseQuery('%D0%B8%D0%BC%D1%8F=value')).toEqual({ имя: 'value' });
    });
});
