export declare function initializeDatabase(): Promise<void>;
export declare function dbAll(sql: string, ...params: any[]): Promise<any[]>;
export declare function dbGet(sql: string, ...params: any[]): Promise<any | undefined>;
export declare function dbRun(sql: string, ...params: any[]): Promise<{
    lastInsertRowid: number;
    changes: number;
}>;
declare const _default: {
    dbAll: typeof dbAll;
    dbGet: typeof dbGet;
    dbRun: typeof dbRun;
};
export default _default;
//# sourceMappingURL=database.d.ts.map