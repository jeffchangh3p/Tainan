"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategorySchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be positive'),
    type: zod_1.z.enum(['income', 'expense']),
    category_id: zod_1.z.number().int().positive().nullable().optional(),
    person: zod_1.z.string().max(50).nullable().optional(),
    description: zod_1.z.string().max(500).nullable().optional(),
    receipt_image: zod_1.z.string().max(700000).nullable().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});
exports.updateTransactionSchema = exports.createTransactionSchema.partial();
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['income', 'expense']),
    icon: zod_1.z.string().max(10).nullable().optional(),
});
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues.map(i => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            });
            return;
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validation.js.map