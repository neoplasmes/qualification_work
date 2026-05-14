/**
 * User data managment
 *
 * @export
 * @interface UserRepo
 */
export interface UserRepo {
    /**
     * Executes an initialize action when user registers
     *
     * @param data
     * @returns
     */
    initialize(data: {
        userId: string;
        orgDisplayName: string;
    }): Promise<{ initialized: boolean; orgId: string | null }>;
}
