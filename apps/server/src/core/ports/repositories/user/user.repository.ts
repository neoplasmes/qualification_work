/**
 * Репозиторий, отвечающий за авторизацию и прочее
 */
export interface UserRepository {
    /**
     * найти по email. Email - UNIQUE
     *
     * @param email
     */
    findByEmail(email: string): Promise<{ id: string } | null>;

    /**
     * найти по email. Email - UNIQUE
     *
     * @param login
     */
    findByLogin(login: string): Promise<{ id: string } | null>;

    /**
     * Создать пользователя
     *
     * @param data
     */
    create(data: {
        login: string;
        passwordHash: string;
        name: string;
        family: string;
    }): Promise<void>;
}
