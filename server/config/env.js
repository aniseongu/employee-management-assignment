import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    APP_PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.string().default('http'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[ENV] 환경변수 검증 실패:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
