import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const EMP_STATUS_VALUES = ['ACTIVE', 'LEAVE', 'RESIGNED'];

export const idParamSchema = z.coerce.number().int().positive({ message: '올바르지 않은 직원 ID입니다.' });

export const employeeCreateSchema = z.object({
    empNo: z.string().trim().min(1, '사번은 필수입니다.').max(20, '사번은 20자 이하여야 합니다.'),
    empName: z.string().trim().min(1, '이름은 필수입니다.').max(100, '이름은 100자 이하여야 합니다.'),
    email: z.string().trim().min(1, '이메일은 필수입니다.').email('이메일 형식이 올바르지 않습니다.'),
    phone: z.string().trim().max(20, '전화번호는 20자 이하여야 합니다.').optional().nullable(),
    hireDate: z.string().regex(DATE_REGEX, '입사일 형식은 YYYY-MM-DD 여야 합니다.'),
    deptId: z.coerce.number().int().positive('부서를 선택하세요.'),
    positionId: z.coerce.number().int().positive('직책을 선택하세요.'),
    managerId: z.coerce.number().int().positive().optional().nullable(),
    empStatus: z.enum(EMP_STATUS_VALUES, { errorMap: () => ({ message: '재직상태 값이 올바르지 않습니다.' }) }),
    memo: z.string().max(2000, '메모는 2000자 이하여야 합니다.').optional().nullable(),
});

export const employeeUpdateSchema = z
    .object({
        empName: z.string().trim().min(1, '이름은 필수입니다.').max(100).optional(),
        email: z.string().trim().min(1, '이메일은 필수입니다.').email('이메일 형식이 올바르지 않습니다.').optional(),
        phone: z.string().trim().max(20).optional().nullable(),
        deptId: z.coerce.number().int().positive('부서를 선택하세요.').optional().nullable(),
        positionId: z.coerce.number().int().positive('직책을 선택하세요.').optional().nullable(),
        managerId: z.coerce.number().int().positive().optional().nullable(),
        memo: z.string().max(2000).optional().nullable(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: '수정할 필드가 없습니다.' });

export const employeeStatusChangeSchema = z.object({
    status: z.enum(EMP_STATUS_VALUES, { errorMap: () => ({ message: '재직상태 값이 올바르지 않습니다.' }) }),
    effectiveDate: z.string().regex(DATE_REGEX, '발효일 형식은 YYYY-MM-DD 여야 합니다.').optional(),
    remark: z.string().max(500).optional().nullable(),
});
