import { ApiError } from './ApiError.js';

export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new ApiError(400, '입력값을 확인해주세요.', result.error.flatten().fieldErrors);
    }
    return result.data;
}
