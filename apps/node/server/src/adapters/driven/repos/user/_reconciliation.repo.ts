/**
 * internal user-related repository interface for checking the uninitialized users
 *
 * @export
 * @interface ReconciliationRepo
 */
export interface ReconciliationRepo {
    findUsersToInitialize(limit: number): Promise<{ userId: string; username: string }[]>;
}
