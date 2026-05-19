export declare function initializeDatabase(): Promise<void>;
export declare function dbAll(sql: string, ...params: any[]): any[];
export declare function dbGet(sql: string, ...params: any[]): any | undefined;
export declare function dbRun(sql: string, ...params: any[]): {
    lastInsertRowid: number;
    changes: number;
};
declare const _default: {
    dbAll: typeof dbAll;
    dbGet: typeof dbGet;
    dbRun: typeof dbRun;
};
export default _default;
//# sourceMappingURL=database.d.ts.map