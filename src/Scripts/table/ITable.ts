export abstract class ITable {
    protected abstract sortColumnInternal: string;
    protected abstract sortOrderInternal: number;
    public abstract readonly tableName: string;
    public abstract doSort(col: string): void;
    public get sortColumn(): string { return this.sortColumnInternal; }
    public get sortOrder(): number { return this.sortOrderInternal; }
    public abstract toString(): string;
}
