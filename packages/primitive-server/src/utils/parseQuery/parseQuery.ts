import type { QueryParams } from '../../types';

const EQUALS = 61; // '='
const AMP = 38; // '&'
const PERCENT = 37; // '%'
const PLUS = 43; // '+'

function addParam(result: QueryParams, key: string, value: string): void {
    const existing = result[key];

    if (Array.isArray(existing)) {
        existing.push(value);
    } else if (typeof existing === 'string') {
        result[key] = [existing, value];
    } else {
        result[key] = value;
    }
}

/**
 * Ручной парсер query строки. Проходит всё за O(n).
 * Запоминает индексы начала и конца ключа и значения, и затем аллоцирует новые полноценные
 * строки только один раз через slice. Это быстрее потому, что если мы работаем
 * прям с символами, то в JavaScritp каждый раз аллоцируется new String, что нехорошо
 *
 * @param queryString
 * @returns объект только с ключами и значениями
 */
export function parseQuery(queryString: string): QueryParams {
    const result: QueryParams = Object.create(null);
    const len = queryString.length;

    if (len === 0) {
        return result;
    }

    let keyStart = 0;
    let keyEnd = -1;
    let valueStart = -1;

    for (let i = 0; i < len; i++) {
        const code = queryString.charCodeAt(i);

        if (code === PERCENT || code === PLUS) {
            throw new Error('+ and % are not implemented');
        } else if (code === EQUALS && keyEnd === -1) {
            // начинаем читать значение
            keyEnd = i;
            valueStart = i + 1;
        } else if (code === AMP) {
            // закончили читать пару ключ-значение
            if (keyEnd === -1) keyEnd = i;
            if (valueStart === -1) valueStart = i;

            const key = queryString.slice(keyStart, keyEnd);
            if (key.length !== 0) {
                const value = queryString.slice(valueStart, i);

                addParam(result, key, value);
            }

            keyStart = i + 1;
            keyEnd = -1;
            valueStart = -1;
        }
    }

    // Последняя пара ключ-значение
    if (keyEnd === -1) {
        keyEnd = len;
    }
    if (valueStart === -1) {
        valueStart = len;
    }

    const key = queryString.slice(keyStart, keyEnd);
    if (key.length !== 0) {
        const value = queryString.slice(valueStart, len);

        addParam(result, key, value);
    }

    return result;
}
