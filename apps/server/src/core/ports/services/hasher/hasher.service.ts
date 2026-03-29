/**
 * Класс, осуществляющий шифрование паролей и их сравнение.
 * Для паролей рекомендовано - argon2id + pepper
 */
export interface Hasher {
    /**
     *
     * @param plain
     */
    hashPassword(plain: string): Promise<string>;

    /**
     *
     * @param plain
     * @param hashed
     */
    verifyPassword(plain: string, hashed: string): Promise<boolean>;
}
