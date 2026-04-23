// TODO: расширить??
export interface Session {
    /**
     * UUID пользователя
     */
    userId: string;
}

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
