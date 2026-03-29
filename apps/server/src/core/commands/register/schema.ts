import { z } from 'zod';

export const registerSchema = z.object({
    password: z.string().min(8, 'Минимум 8 символов'),
    login: z.string().min(8, 'Минимум 8 символов'),
    name: z.string().min(1, 'Имя обязательно'),
    family: z.string().min(1, 'Фамилия обязательна'),
});
