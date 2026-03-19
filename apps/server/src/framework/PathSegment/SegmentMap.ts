import type { PathSegment } from './PathSegment';

type Bucket = {
    key: string;
    value: PathSegment;
};

export class SegmentMap {
    /**
     * Вёдра
     *
     * @private
     * @type {Array<Array<Bucket>>}
     */
    private buckets: Array<Array<Bucket>>;

    /**
     * на 1 меньше числа вёдер, чтобы как раз получалось вычислять с помощью побитового
     * объединения номер нужного ведра.
     *
     * @private
     * @type {number}
     */
    private mask: number;

    constructor(capacity = 64) {
        /**
         * Размер всегда степень двойки, чтобы вместо % делать &
         * это круто потому, что операция & занимает 1 такт, а % 10000000000
         */
        const size = nextPowerOfTwo(capacity);
        this.buckets = new Array(size);
        for (let i = 0; i < size; i++) {
            this.buckets[i] = [];
        }
        this.mask = size - 1;
    }

    /**
     * Это вызывается только при addRoute, поэтому здесь производительность не важна
     */
    set(key: string, value: PathSegment): void {
        const hash = hashString(key, 0, key.length);
        // ведро
        const bucket = this.buckets[hash & this.mask];

        // дубликат
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].key === key) {
                bucket[i].value = value;
                return;
            }
        }

        bucket.push({ key, value });
    }

    /**
     * Обёртка над getByRange для поиска по полному ключу.
     * Используется только при addRoute/merge, поэтому по барабану эффективно это работает или нет
     */
    get(key: string): PathSegment | null {
        return this.getByRange(key, 0, key.length);
    }

    /**
     * Используется только при addRoute/merge, поэтому по барабану эффективно это работает или нет
     */
    forEach(callback: (value: PathSegment, key: string) => void): void {
        for (let i = 0; i < this.buckets.length; i++) {
            const bucket = this.buckets[i];

            for (let j = 0; j < bucket.length; j++) {
                callback(bucket[j].value, bucket[j].key);
            }
        }
    }

    /**
     * Итератор-генератор!!! (они должны быть генераторами, либо каким-то ужасом), чтобы можно было делать мердж
     */
    *[Symbol.iterator](): Iterator<[string, PathSegment]> {
        for (let i = 0; i <= this.mask; i++) {
            const bucket = this.buckets[i];

            for (let j = 0; j < bucket.length; j++) {
                // map-подобный return
                yield [bucket[j].key, bucket[j].value];
            }
        }
    }

    getByRange(source: string, start: number, end: number): PathSegment | null {
        const segmentLength = end - start;
        const hash = hashString(source, start, end);
        // ведро
        const bucket = this.buckets[hash & this.mask];

        outer: for (let i = 0; i < bucket.length; i++) {
            const entry = bucket[i];

            if (entry.key.length !== segmentLength) {
                continue;
            }

            for (let j = 0; j < segmentLength; j++) {
                if (source.charCodeAt(start + j) !== entry.key.charCodeAt(j)) {
                    // не совпало - пробуем следующий элемент в ведре
                    continue outer;
                }
            }

            return entry.value;
        }

        return null;
    }
}

/**
 * Я не знаю как это работает я это скопировал
 * Хеш-функция, работающая по диапазону символов.
 * FNV-1a — простая, быстрая, хорошее распределение.
 *
 * @param str
 * @param start
 * @param end
 * @returns
 */
function hashString(str: string, start: number, end: number): number {
    let hash = 0x811c9dc5; // FNV offset basis (32-bit)

    for (let i = start; i < end; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 0x01000193) | 0; // FNV prime, | 0 для 32-bit int
    }

    return hash >>> 0; // unsigned
}

/**
 * это я тоже не знаю как работает
 *
 * @param n
 * @returns
 */
function nextPowerOfTwo(n: number): number {
    let v = n - 1;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    return v + 1;
}
