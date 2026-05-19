import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const createTransactionSchema: z.ZodObject<{
    amount: z.ZodNumber;
    type: z.ZodEnum<["income", "expense"]>;
    category_id: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    person: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    receipt_image: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "income" | "expense";
    amount: number;
    date: string;
    category_id?: number | null | undefined;
    person?: string | null | undefined;
    description?: string | null | undefined;
    receipt_image?: string | null | undefined;
}, {
    type: "income" | "expense";
    amount: number;
    date: string;
    category_id?: number | null | undefined;
    person?: string | null | undefined;
    description?: string | null | undefined;
    receipt_image?: string | null | undefined;
}>;
export declare const updateTransactionSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["income", "expense"]>>;
    category_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    person: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    receipt_image: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "income" | "expense" | undefined;
    amount?: number | undefined;
    date?: string | undefined;
    category_id?: number | null | undefined;
    person?: string | null | undefined;
    description?: string | null | undefined;
    receipt_image?: string | null | undefined;
}, {
    type?: "income" | "expense" | undefined;
    amount?: number | undefined;
    date?: string | undefined;
    category_id?: number | null | undefined;
    person?: string | null | undefined;
    description?: string | null | undefined;
    receipt_image?: string | null | undefined;
}>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["income", "expense"]>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "income" | "expense";
    icon?: string | null | undefined;
}, {
    name: string;
    type: "income" | "expense";
    icon?: string | null | undefined;
}>;
export declare function validate(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map