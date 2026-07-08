/**
 * Более продвинутая замена String.prototype.split('/')
 * обрабатывает даже '///a/b//:c' => ['a', 'b', ':c']
 *
 * @export
 * @param {string} path
 * @returns {string[]}
 */
export function parsePath(path: string): string[] {
    const result: string[] = [];

    // Случай, когда path не начинается со слэша мы обрабатываем так, как будто он есть
    const startsWithSlash = path.startsWith('/');
    let prevCh: string = '/';
    for (let i = startsWithSlash ? 1 : 0; i < path.length; i++) {
        const ch = path[i];

        if (ch === '/' && prevCh === '/') {
            // попались слэши, идущие подряд
            continue;
        } else if (ch !== '/' && prevCh === '/') {
            // начался новый сегмент
            result.push(ch);
        } else if (ch !== '/' && prevCh !== '/') {
            // продолжается последний запушенный сегмент
            result[result.length - 1] += ch;
        } else if (ch === '/' && prevCh !== '/') {
            // последний запушенный сегмент закончился
        }

        prevCh = ch;
    }

    return result;
}
