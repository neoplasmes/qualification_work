import { describe, expect, it } from 'vitest';

import { parsePath } from './parsePath';

describe('parsePath', () => {
    it('default behaviour', () => {
        expect(parsePath('/a/b/c')).toEqual(['a', 'b', 'c']);
    });

    it('парсит двойные слеши', () => {
        expect(parsePath('///a/b//:c')).toEqual(['a', 'b', ':c']);
    });

    it('парсит без ведущего слеша', () => {
        expect(parsePath('api/beep/c')).toEqual(['api', 'beep', 'c']);
    });

    it('игнорирует слеш в конце', () => {
        expect(parsePath('/a/b/')).toEqual(['a', 'b']);
    });

    it('корневой путь - пустой массив', () => {
        expect(parsePath('/')).toEqual([]);
    });

    it('пустая строка - пустой массив', () => {
        expect(parsePath('')).toEqual([]);
    });

    it('один сегмент - один элемент', () => {
        expect(parsePath('/users')).toEqual(['users']);
    });

    it('параметры с двоеточием остаются как есть', () => {
        expect(parsePath('/users/:id')).toEqual(['users', ':id']);
    });

    it('wildcard', () => {
        expect(parsePath('/files/*')).toEqual(['files', '*']);
    });

    it('не ломается от заглавных букв', () => {
        expect(parsePath('/API/Users')).toEqual(['API', 'Users']);
    });

    it('числовые сегменты - строки', () => {
        expect(parsePath('/v2/items/42')).toEqual(['v2', 'items', '42']);
    });

    it('нижнее подчёркивание в сегментах', () => {
        expect(parsePath('/some_path/with_underscore')).toEqual([
            'some_path',
            'with_underscore',
        ]);
    });
});
